import { NextRequest, NextResponse } from 'next/server';
import { generateToken, setSessionCookie, hashPassword } from '@vorklee2/core-auth';
import { db } from '@/db/db';
import { organizations, globalUsers, apps, subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, organizationName } = await request.json();

    if (!name || !email || !password || !organizationName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUsers = await db.select().from(globalUsers).where(eq(globalUsers.email, email)).limit(1);
    
    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Create organization
    const [organization] = await db
      .insert(organizations)
      .values({
        name: organizationName,
        ownerEmail: email,
      })
      .returning();

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const [user] = await db
      .insert(globalUsers)
      .values({
        name,
        email,
        passwordHash,
        organizationId: organization.id,
        role: 'org_admin',
      })
      .returning();

    // Get Notes app ID
    const [notesApp] = await db.select().from(apps).where(eq(apps.code, 'notes')).limit(1);

    // Create subscription for Notes app (Free plan by default)
    if (notesApp) {
      await db.insert(subscriptions).values({
        organizationId: organization.id,
        appId: notesApp.id,
        planCode: 'free',
        status: 'active',
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      orgId: organization.id,
      email: user.email,
      role: user.role || 'org_admin',
    });

    // Set session cookie
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      organization: {
        id: organization.id,
        name: organization.name,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: `Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

