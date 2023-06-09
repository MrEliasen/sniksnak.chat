import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { importVerifyKey, verify } from "~/utils/crypto-helper";

const NotFoundError = new TRPCError({
    code: "NOT_FOUND",
    message: "Room not found",
});

export const roomRouter = createTRPCRouter({
    createRoom: publicProcedure
        .input(z.object({ publicKey: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return await ctx.prisma.room.create({
                data: {
                    publicKey: input.publicKey,
                },
            });
        }),
    getRoom: publicProcedure
        .input(
            z.object({
                roomId: z.string(),
            }),
        )
        .query(async ({ ctx, input }) => {
            const room = await ctx.prisma.room.findFirst({
                where: {
                    id: input.roomId,
                },
            });

            if (!room) {
                throw NotFoundError;
            }

            return room;
        }),
    getMessages: publicProcedure
        .input(
            z.object({
                roomId: z.string(),
                timestamp: z.date().optional(),
            }),
        )
        .query(({ ctx, input }) => {
            return ctx.prisma.room.findFirst({
                where: {
                    id: input.roomId,
                },
                select: {
                    messages: {
                        where: {
                            createdAt: {
                                gt: input.timestamp,
                            },
                        },
                        orderBy: {
                            createdAt: "asc",
                        },
                    },
                },
            });
        }),
    addMessage: publicProcedure
        .input(
            z.object({
                roomId: z.string(),
                ciphertext: z.string(),
                iv: z.string(),
                messageSignature: z.string(),
                authorSignature: z.string(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const room = await ctx.prisma.room.findFirst({
                where: { id: input.roomId },
            });

            if (!room) {
                throw NotFoundError;
            }

            const publicKey = await importVerifyKey(room.publicKey);

            const verified = await verify(
                `${input.ciphertext}|${input.iv}`,
                input.messageSignature,
                publicKey,
            );

            if (!verified) {
                throw NotFoundError;
            }

            return await ctx.prisma.message.create({
                data: {
                    message: input.ciphertext,
                    iv: input.iv,
                    messageSignature: input.messageSignature,
                    authorSignature: input.authorSignature,
                    room: {
                        connect: {
                            id: input.roomId,
                        },
                    },
                },
            });
        }),
});
