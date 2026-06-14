import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { prisma } from '../lib/prisma';
import { sendTeamInvitation, acceptTeamInvitation, revokeTeamInvitation } from '../services/invitation.service';

vi.mock('../services/mailer.service', () => ({
  mailerService: {
    sendInvitationEmail: vi.fn().mockResolvedValue(true),
  },
}));

describe('Team Invitation Integration (Staging DB)', () => {
  let orgId: string;
  let adminUserId: string;
  let targetUserId: string;
  let roleId: string;
  let inviteToken: string;

  beforeAll(async () => {
    // Setup test data in Staging DB
    const org = await prisma.organization.create({
      data: { name: 'Test Org - Invitation' }
    });
    orgId = org.id;

    const role = await prisma.role.create({
      data: { name: 'Admin', organizationId: orgId }
    });
    roleId = role.id;

    const admin = await prisma.user.create({
      data: {
        email: 'admin.invite@nexworth.cc',
        passwordHash: 'hashed_pw',
        organizationId: orgId,
        roleId: roleId
      }
    });
    adminUserId = admin.id;

    const target = await prisma.user.create({
      data: {
        email: 'target.invite@nexworth.cc',
        passwordHash: 'hashed_pw',
      }
    });
    targetUserId = target.id;
  });

  afterAll(async () => {
    // Cleanup test data from Staging DB
    await prisma.user.deleteMany({
      where: { id: { in: [adminUserId, targetUserId] } }
    });
    await prisma.role.deleteMany({
      where: { id: roleId }
    });
    await prisma.organization.deleteMany({
      where: { id: orgId }
    });
  });

  it('SHOULD successfully send an invitation and create a token', async () => {
    const invite = await sendTeamInvitation(
      'target.invite@nexworth.cc',
      orgId,
      roleId,
      adminUserId
    );

    expect(invite).toBeDefined();
    expect(invite.token).toBeDefined();
    expect(invite.status).toBe('PENDING');
    expect(invite.email).toBe('target.invite@nexworth.cc');

    inviteToken = invite.token;
  });

  it('SHOULD fail to send invitation if user is already in the org', async () => {
    await expect(sendTeamInvitation(
      'admin.invite@nexworth.cc',
      orgId,
      roleId,
      adminUserId
    )).rejects.toThrow('USER_ALREADY_IN_ORG');
  });

  it('SHOULD fail to send duplicate pending invitation', async () => {
    await expect(sendTeamInvitation(
      'target.invite@nexworth.cc',
      orgId,
      roleId,
      adminUserId
    )).rejects.toThrow('INVITATION_ALREADY_SENT');
  });

  it('SHOULD successfully accept the invitation and update user role', async () => {
    const updatedUser = await acceptTeamInvitation(inviteToken, targetUserId);

    expect(updatedUser.organizationId).toBe(orgId);
    expect(updatedUser.roleId).toBe(roleId);

    const inviteRecord = await prisma.invitation.findUnique({
      where: { token: inviteToken }
    });
    expect(inviteRecord?.status).toBe('ACCEPTED');
  });

  it('SHOULD fail to accept an already accepted invitation', async () => {
    await expect(acceptTeamInvitation(inviteToken, targetUserId)).rejects.toThrow('INVITATION_NOT_PENDING');
  });

  it('SHOULD successfully revoke a pending invitation', async () => {
    // 1. Send another invitation
    const invite = await sendTeamInvitation(
      'another.invite@nexworth.cc',
      orgId,
      roleId,
      adminUserId
    );

    // 2. Revoke it
    const revoked = await revokeTeamInvitation(invite.id, orgId, adminUserId);
    expect(revoked.status).toBe('REVOKED');

    // 3. Trying to accept it should fail
    const anotherUser = await prisma.user.create({
      data: {
        email: 'another.invite@nexworth.cc',
        passwordHash: 'hashed_pw',
      }
    });

    await expect(acceptTeamInvitation(invite.token, anotherUser.id)).rejects.toThrow('INVITATION_REVOKED');

    // Cleanup anotherUser
    await prisma.user.delete({ where: { id: anotherUser.id } });
  });
});

import { sendInvitationHandler, revokeInvitationHandler } from '../controllers/invitation.controller';
import { FastifyRequest, FastifyReply } from 'fastify';

describe('Invitation Controller Handlers (Role Protection Validation)', () => {
  let orgId: string;
  let adminRoleId: string;
  let userRoleId: string;
  let adminUser: any;
  let normalUser: any;
  let testInviteId: string;

  beforeAll(async () => {
    // Setup test organization in Staging DB
    const org = await prisma.organization.create({ data: { name: 'Controller Test Org' } });
    orgId = org.id;

    const adminRole = await prisma.role.create({ data: { name: 'Admin', organizationId: orgId } });
    adminRoleId = adminRole.id;

    const userRole = await prisma.role.create({ data: { name: 'User', organizationId: orgId } });
    userRoleId = userRole.id;

    const admin = await prisma.user.create({
      data: { email: 'ctrl.admin@nexworth.cc', passwordHash: 'hash', organizationId: orgId, roleId: adminRoleId }
    });
    adminUser = admin;

    const normal = await prisma.user.create({
      data: { email: 'ctrl.user@nexworth.cc', passwordHash: 'hash', organizationId: orgId, roleId: userRoleId }
    });
    normalUser = normal;
  });

  afterAll(async () => {
    if (testInviteId) {
      await prisma.invitation.deleteMany({ where: { id: testInviteId } });
    }
    await prisma.user.deleteMany({ where: { organizationId: orgId } });
    await prisma.role.deleteMany({ where: { organizationId: orgId } });
    await prisma.organization.delete({ where: { id: orgId } });
  });

  it('SHOULD fail to send invitation via handler if request user has insufficient role', async () => {
    const mockRequest = {
      user: { id: normalUser.id, organizationId: orgId, roleId: userRoleId, isSystemAdmin: false },
      body: { email: 'test.guest@nexworth.cc', roleId: userRoleId },
      log: { error: vi.fn() }
    } as unknown as FastifyRequest;

    let statusCode = 200;
    let response: any = null;
    const mockReply = {
      status: (code: number) => { statusCode = code; return mockReply; },
      send: (data: any) => { response = data; return mockReply; }
    } as unknown as FastifyReply;

    await sendInvitationHandler(mockRequest, mockReply);

    expect(statusCode).toBe(403);
    expect(response.error).toContain('Insufficient permissions');
  });

  it('SHOULD successfully send invitation via handler if request user is Admin', async () => {
    const mockRequest = {
      user: { id: adminUser.id, organizationId: orgId, roleId: adminRoleId, isSystemAdmin: false },
      body: { email: 'test.guest@nexworth.cc', roleId: userRoleId },
      log: { error: vi.fn() }
    } as unknown as FastifyRequest;

    let statusCode = 200;
    let response: any = null;
    const mockReply = {
      status: (code: number) => { statusCode = code; return mockReply; },
      send: (data: any) => { response = data; return mockReply; }
    } as unknown as FastifyReply;

    await sendInvitationHandler(mockRequest, mockReply);

    expect(statusCode).toBe(201);
    expect(response.invitation).toBeDefined();
    testInviteId = response.invitation.id;
  });

  it('SHOULD fail to revoke invitation via handler if request user has insufficient role', async () => {
    const mockRequest = {
      user: { id: normalUser.id, organizationId: orgId, roleId: userRoleId, isSystemAdmin: false },
      params: { id: testInviteId },
      log: { error: vi.fn() }
    } as unknown as FastifyRequest;

    let statusCode = 200;
    let response: any = null;
    const mockReply = {
      status: (code: number) => { statusCode = code; return mockReply; },
      send: (data: any) => { response = data; return mockReply; }
    } as unknown as FastifyReply;

    await revokeInvitationHandler(mockRequest, mockReply);

    expect(statusCode).toBe(403);
    expect(response.error).toContain('Insufficient permissions');
  });

  it('SHOULD successfully revoke invitation via handler if request user is Admin', async () => {
    const mockRequest = {
      user: { id: adminUser.id, organizationId: orgId, roleId: adminRoleId, isSystemAdmin: false },
      params: { id: testInviteId },
      log: { error: vi.fn() }
    } as unknown as FastifyRequest;

    let statusCode = 200;
    let response: any = null;
    const mockReply = {
      status: (code: number) => { statusCode = code; return mockReply; },
      send: (data: any) => { response = data; return mockReply; }
    } as unknown as FastifyReply;

    await revokeInvitationHandler(mockRequest, mockReply);

    expect(statusCode).toBe(200);
    expect(response.message).toContain('successfully');
  });
});

