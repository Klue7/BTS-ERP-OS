import { prisma } from '../../../prisma/client.ts';
import { createSessionCookie, createSessionToken, clearSessionCookie, hashSessionToken, readSessionToken, verifyPassword } from '../vendor-auth.ts';
import { getInventorySupplier } from '../inventory/service.ts';
import type { SupplierPortalSession } from '../../inventory/contracts';

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;

export async function loginSupplierPortal(email: string, password: string) {
  const user = await prisma.vendorUser.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: { supplier: true },
  });

  if (!user || !user.isActive) {
    throw new Error('Invalid supplier portal credentials.');
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid supplier portal credentials.');
  }

  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.$transaction([
    prisma.vendorSession.create({
      data: {
        userId: user.id,
        sessionTokenHash: hashSessionToken(token),
        expiresAt,
      },
    }),
    prisma.vendorUser.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    }),
  ]);

  return {
    user,
    cookie: createSessionCookie(token, expiresAt),
  };
}

export async function resolveSupplierPortalSession(headers: { cookie?: string }): Promise<SupplierPortalSession | null> {
  const rawToken = readSessionToken(headers);
  if (!rawToken) {
    return null;
  }

  const session = await prisma.vendorSession.findUnique({
    where: { sessionTokenHash: hashSessionToken(rawToken) },
    include: {
      user: true,
    },
  });

  if (!session || session.expiresAt.getTime() <= Date.now() || !session.user.isActive) {
    return null;
  }

  await prisma.vendorSession.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  });

  const supplier = await prisma.supplier.findUniqueOrThrow({
    where: { id: session.user.supplierId },
    select: { supplierKey: true },
  });
  const vendor = await getInventorySupplier(supplier.supplierKey);

  return {
    ok: true,
    vendor,
    user: {
      id: session.user.id,
      email: session.user.email,
      fullName: session.user.fullName,
      roleLabel: session.user.roleLabel,
      isActive: session.user.isActive,
      lastLoginAt: session.user.lastLoginAt?.toISOString() ?? null,
    },
  };
}

export async function logoutSupplierPortal(headers: { cookie?: string }) {
  const rawToken = readSessionToken(headers);

  if (rawToken) {
    await prisma.vendorSession.deleteMany({
      where: { sessionTokenHash: hashSessionToken(rawToken) },
    });
  }

  return clearSessionCookie();
}
