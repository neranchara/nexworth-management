import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { sendTeamInvitation, acceptTeamInvitation } from '../services/invitation.service';
import { prisma } from '../lib/prisma';

const sendInviteSchema = z.object({
  email: z.string().email(),
  roleId: z.string().uuid(),
});

export const sendInvitationHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    if (!user.organizationId) {
      return reply.status(400).send({ error: 'User does not belong to an organization' });
    }

    // Role verification (Only Admin can send invites)
    // We fetch the current user's role to check if they have invite permissions
    const currentUserRole = await prisma.role.findUnique({
      where: { id: user.roleId },
      include: { permissions: true }
    });

    if (!currentUserRole || (currentUserRole.name !== 'Admin' && currentUserRole.name !== 'Owner' && !user.isSystemAdmin)) {
        return reply.status(403).send({ error: 'Insufficient permissions to send invitations' });
    }

    const { email, roleId } = sendInviteSchema.parse(request.body);

    const invitation = await sendTeamInvitation(email, user.organizationId, roleId, user.id);

    return reply.status(201).send({
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        status: invitation.status,
      }
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ error: error.format() });
    }
    
    if (error.message === 'USER_ALREADY_IN_ORG') {
      return reply.status(400).send({ error: 'User is already a member of this organization' });
    }
    if (error.message === 'INVITATION_ALREADY_SENT') {
      return reply.status(400).send({ error: 'An active invitation is already pending for this email' });
    }
    if (error.message === 'INVALID_ORG_OR_ROLE') {
      return reply.status(400).send({ error: 'Invalid organization or role' });
    }

    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

const acceptInviteSchema = z.object({
  token: z.string().min(1),
});

export const acceptInvitationHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    const { token } = acceptInviteSchema.parse(request.body);

    const updatedUser = await acceptTeamInvitation(token, user.id);

    return reply.status(200).send({
      message: 'Invitation accepted successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        organizationId: updatedUser.organizationId,
        roleId: updatedUser.roleId
      }
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ error: error.format() });
    }

    if (error.message === 'INVALID_TOKEN') {
      return reply.status(404).send({ error: 'Invitation not found or invalid token' });
    }
    if (error.message === 'INVITATION_NOT_PENDING') {
      return reply.status(400).send({ error: 'This invitation has already been processed' });
    }
    if (error.message === 'INVITATION_EXPIRED') {
      return reply.status(400).send({ error: 'This invitation has expired' });
    }
    if (error.message === 'USER_NOT_FOUND') {
      return reply.status(404).send({ error: 'User not found' });
    }
    if (error.message === 'EMAIL_MISMATCH') {
      return reply.status(403).send({ error: 'This invitation was sent to a different email address' });
    }

    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const getInvitationsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    if (!user.organizationId) {
      return reply.status(400).send({ error: 'User does not belong to an organization' });
    }

    const invitations = await prisma.invitation.findMany({
      where: { organizationId: user.organizationId },
      include: {
        role: { select: { name: true } },
        invitedBy: { select: { firstName: true, lastName: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return reply.status(200).send(invitations);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};
