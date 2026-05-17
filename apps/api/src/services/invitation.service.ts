import { prisma } from '../lib/prisma';
import crypto from 'crypto';
import { mailerService } from './mailer.service';

export const sendTeamInvitation = async (
  email: string,
  organizationId: string,
  roleId: string,
  invitedByUserId: string
) => {
  // 1. Check if user is already in the organization
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser && existingUser.organizationId === organizationId) {
    throw new Error('USER_ALREADY_IN_ORG');
  }

  // 2. Check if there's already a pending invitation for this org
  const existingInvite = await prisma.invitation.findFirst({
    where: {
      email,
      organizationId,
      status: 'PENDING',
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (existingInvite) {
    throw new Error('INVITATION_ALREADY_SENT');
  }

  // 3. Generate secure token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

  // 4. Get Org and Role details for email
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  const role = await prisma.role.findUnique({ where: { id: roleId } });

  if (!org || !role) {
    throw new Error('INVALID_ORG_OR_ROLE');
  }

  // 5. Create Invitation Record
  const invitation = await prisma.invitation.create({
    data: {
      email,
      organizationId,
      roleId,
      token,
      expiresAt,
      invitedByUserId,
      status: 'PENDING',
    },
  });

  // 6. Send Email
  await mailerService.sendInvitationEmail(email, token, org.name, role.name);

  return invitation;
};

export const acceptTeamInvitation = async (token: string, userId: string) => {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
  });

  if (!invitation) {
    throw new Error('INVALID_TOKEN');
  }

  if (invitation.status !== 'PENDING') {
    throw new Error('INVITATION_NOT_PENDING');
  }

  if (invitation.expiresAt < new Date()) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED' },
    });
    throw new Error('INVITATION_EXPIRED');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  // Security: Check if the logged-in user's email matches the invitation email
  if (user.email !== invitation.email) {
     throw new Error('EMAIL_MISMATCH');
  }

  // Atomic transaction to update user and invitation status
  const result = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        organizationId: invitation.organizationId,
        roleId: invitation.roleId,
      },
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' },
    }),
  ]);

  return result[0];
};
