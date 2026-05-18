import { PubSub, withFilter } from 'graphql-subscriptions';

const pubsub = new PubSub<any>();

export const resolvers = {
  Query: {
    users: async (_: any, __: any, { prisma }: any) => {
      return prisma.user.findMany();
    },
    me: async (_: any, __: any, { prisma }: any) => {
      // Return first user as mock session for demo/simplicity
      return prisma.user.findFirst();
    },
    gigs: async (_: any, __: any, { prisma }: any) => {
      return prisma.gig.findMany();
    },
    gig: async (_: any, { id }: { id: string }, { prisma }: any) => {
      return prisma.gig.findUnique({ where: { id } });
    },
    messages: async (_: any, { gigId }: { gigId: string }, { prisma }: any) => {
      return prisma.message.findMany({
        where: { gigId },
        orderBy: { createdAt: 'asc' },
      });
    },
    applications: async (_: any, { gigId }: { gigId: string }, { prisma }: any) => {
      return prisma.application.findMany({
        where: { gigId },
        orderBy: { createdAt: 'desc' },
      });
    },
  },

  Mutation: {
    register: async (_: any, { email, name }: { email: string; name: string }, { prisma }: any) => {
      return prisma.user.create({
        data: { email, name, role: 'USER' },
      });
    },

    createGig: async (
      _: any,
      { title, description, budget, milestones }: { title: string; description: string; budget: number; milestones: Array<{ title: string; amount: number }> },
      { prisma }: any
    ) => {
      let user = await prisma.user.findFirst();
      if (!user) {
        user = await prisma.user.create({
          data: { email: 'creator@collabsphere.com', name: 'Creator User', role: 'USER' },
        });
      }

      return prisma.gig.create({
        data: {
          title,
          description,
          budget,
          creatorId: user.id,
          milestones: {
            create: milestones.map((m) => ({
              title: m.title,
              amount: m.amount,
              status: 'PENDING',
            })),
          },
        },
      });
    },

    applyToGig: async (
      _: any,
      { gigId, pitch, budget }: { gigId: string; pitch: string; budget: number },
      { prisma }: any
    ) => {
      let freelancer = await prisma.user.findFirst({
        where: { email: 'freelancer@collabsphere.com' },
      });
      if (!freelancer) {
        freelancer = await prisma.user.create({
          data: { email: 'freelancer@collabsphere.com', name: 'Freelancer Dev', role: 'USER' },
        });
      }

      return prisma.application.create({
        data: {
          gigId,
          freelancerId: freelancer.id,
          pitch,
          budget,
          status: 'PENDING',
        },
      });
    },

    updateApplicationStatus: async (
      _: any,
      { applicationId, status }: { applicationId: string; status: 'PENDING' | 'ACCEPTED' | 'REJECTED' },
      { prisma }: any
    ) => {
      return prisma.application.update({
        where: { id: applicationId },
        data: { status },
      });
    },

    updateMilestoneStatus: async (
      _: any,
      { milestoneId, status }: { milestoneId: string; status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' },
      { prisma }: any
    ) => {
      const milestone = await prisma.milestone.update({
        where: { id: milestoneId },
        data: { status },
      });

      pubsub.publish('MILESTONE_UPDATED', { milestoneUpdated: milestone });
      return milestone;
    },

    sendMessage: async (
      _: any,
      { gigId, content }: { gigId: string; content: string },
      { prisma }: any
    ) => {
      let sender = await prisma.user.findFirst();
      if (!sender) {
        sender = await prisma.user.create({
          data: { email: 'default@collabsphere.com', name: 'Default User', role: 'USER' },
        });
      }

      const message = await prisma.message.create({
        data: {
          gigId,
          senderId: sender.id,
          content,
        },
      });

      pubsub.publish('MESSAGE_SENT', { messageSent: message });
      return message;
    },
  },

  Subscription: {
    messageSent: {
      subscribe: withFilter(
        () => pubsub.asyncIterableIterator(['MESSAGE_SENT']),
        (payload, variables) => {
          return payload.messageSent.gigId === variables.gigId;
        }
      ),
    },
    milestoneUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterableIterator(['MILESTONE_UPDATED']),
        (payload, variables) => {
          return payload.milestoneUpdated.gigId === variables.gigId;
        }
      ),
    },
  },

  // Field Resolvers
  User: {
    gigs: async (user: any, __: any, { prisma }: any) => {
      return prisma.gig.findMany({ where: { creatorId: user.id } });
    },
    applications: async (user: any, __: any, { prisma }: any) => {
      return prisma.application.findMany({ where: { freelancerId: user.id } });
    },
    messages: async (user: any, __: any, { prisma }: any) => {
      return prisma.message.findMany({ where: { senderId: user.id } });
    },
  },

  Gig: {
    creator: async (gig: any, __: any, { prisma }: any) => {
      return prisma.user.findUnique({ where: { id: gig.creatorId } });
    },
    applications: async (gig: any, __: any, { prisma }: any) => {
      return prisma.application.findMany({ where: { gigId: gig.id } });
    },
    milestones: async (gig: any, __: any, { prisma }: any) => {
      return prisma.milestone.findMany({ where: { gigId: gig.id } });
    },
    messages: async (gig: any, __: any, { prisma }: any) => {
      return prisma.message.findMany({ where: { gigId: gig.id } });
    },
  },

  Application: {
    gig: async (app: any, __: any, { prisma }: any) => {
      return prisma.gig.findUnique({ where: { id: app.gigId } });
    },
    freelancer: async (app: any, __: any, { prisma }: any) => {
      return prisma.user.findUnique({ where: { id: app.freelancerId } });
    },
  },

  Milestone: {
    gig: async (milestone: any, __: any, { prisma }: any) => {
      return prisma.gig.findUnique({ where: { id: milestone.gigId } });
    },
  },

  Message: {
    sender: async (message: any, __: any, { prisma }: any) => {
      return prisma.user.findUnique({ where: { id: message.senderId } });
    },
  },
};
