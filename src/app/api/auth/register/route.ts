import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { generateToken } from '@/lib/auth';
import { Institute, Branch, User, Subscription } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { 
      instituteName, 
      ownerName, 
      email, 
      phone, 
      password, 
      city = 'New Delhi', 
      address = 'Main Center' 
    } = await req.json();

    if (!instituteName || !ownerName || !email || !password || !phone) {
      return NextResponse.json({ error: 'All fields are strictly required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const instituteId = 'inst-' + Date.now();
    const branchId = 'branch-' + Date.now();
    const userId = 'user-' + Date.now();
    const slug = instituteName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    // 1. Create Institute
    const newInstitute: Institute = {
      id: instituteId,
      name: instituteName,
      slug: slug + '-' + Math.floor(Math.random() * 1000),
      email,
      phone,
      aiTone: 'helpful_professional',
      welcomeMessage: `Namaste! Welcome to ${instituteName}. How can I assist you with admissions today?`,
      currency: 'INR',
      address: `${address}, ${city}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.createInstitute(newInstitute);

    // 2. Create Default Headquarters Branch
    const newBranch: Branch = {
      id: branchId,
      instituteId,
      name: `${city} Main Center`,
      city,
      address,
      phone,
      email,
      isHeadquarters: true,
      createdAt: new Date().toISOString()
    };
    db.createBranch(newBranch);

    // 3. Create Institute Owner User
    const newUser: User = {
      id: userId,
      instituteId,
      branchId,
      name: ownerName,
      email,
      passwordHash,
      role: 'INSTITUTE_OWNER',
      phone,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    db.createUser(newUser);

    // 4. Create Trial Subscription
    const newSub: Subscription = {
      id: 'sub-' + Date.now(),
      instituteId,
      tier: 'STARTER',
      status: 'TRIAL',
      leadsUsed: 0,
      leadsQuota: 500,
      ragQueriesUsed: 0,
      ragQueriesQuota: 100,
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    };
    db.getData().subscriptions.push(newSub);
    db.persist();

    const token = generateToken(newUser);

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        instituteId,
        branchId,
      },
      institute: newInstitute
    });

    response.cookies.set('admitflow_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    });

    return response;
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Registration failed' }, { status: 500 });
  }
}
