# Auth Bypass Patterns for E2E Testing

## Strategy

Create a debug user that bypasses OTP and captcha, controlled by an environment variable. The bypass is temporary — the skill tracks every change and reverts after testing.

## Environment Variable

```env
# .env.local (never committed)
E2E_DEBUG_USER=true
E2E_DEBUG_EMAIL=e2e-test@debug.local
E2E_DEBUG_PASSWORD=e2e-debug-password-123
```

## Common Next.js Patterns

### NextAuth.js / Auth.js

Modify the credentials provider to accept debug credentials:

```typescript
// auth.ts or [...nextauth].ts
CredentialsProvider({
  async authorize(credentials) {
    // Debug bypass — REVERT AFTER TESTING
    if (
      process.env.E2E_DEBUG_USER === "true" &&
      credentials.email === process.env.E2E_DEBUG_EMAIL
    ) {
      return {
        id: "e2e-debug-user",
        email: process.env.E2E_DEBUG_EMAIL,
        name: "E2E Debug User",
      };
    }
    // ... normal auth flow
  },
})
```

### Supabase Auth

Add a bypass in the login API route:

```typescript
// app/api/auth/login/route.ts
export async function POST(req: Request) {
  const { email, password } = await req.json();

  // Debug bypass — REVERT AFTER TESTING
  if (
    process.env.E2E_DEBUG_USER === "true" &&
    email === process.env.E2E_DEBUG_EMAIL
  ) {
    const { data } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    const { data: session } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return Response.json({ session });
  }
  // ... normal auth flow
}
```

### Captcha Bypass

```typescript
// Wherever captcha is validated
async function verifyCaptcha(token: string): Promise<boolean> {
  // Debug bypass — REVERT AFTER TESTING
  if (process.env.E2E_DEBUG_USER === "true" && token === "e2e-bypass") {
    return true;
  }
  // ... normal captcha verification
}
```

On the frontend:

```typescript
const captchaToken =
  process.env.NEXT_PUBLIC_E2E_DEBUG_USER === "true"
    ? "e2e-bypass"
    : await getCaptchaToken();
```

### OTP Bypass

```typescript
async function verifyOTP(code: string, userId: string): Promise<boolean> {
  // Debug bypass — REVERT AFTER TESTING
  if (process.env.E2E_DEBUG_USER === "true" && code === "000000") {
    return true;
  }
  // ... normal OTP verification
}
```

## Revert Checklist Format

The orchestrator must track every change for cleanup:

```json
[
  {
    "file_path": "src/auth.ts",
    "change_type": "modified",
    "original_content": "< full original file content >",
    "description": "Added debug user bypass in credentials provider"
  },
  {
    "file_path": ".env.local",
    "change_type": "modified",
    "original_content": "< original .env.local content >",
    "description": "Added E2E_DEBUG_USER, E2E_DEBUG_EMAIL, E2E_DEBUG_PASSWORD"
  }
]
```

## Security Notes

- Debug credentials must NEVER be committed to version control
- The `E2E_DEBUG_USER` env var should only be set in `.env.local`
- All bypass code includes `// REVERT AFTER TESTING` comments for visibility
- The revert checklist is the source of truth — every file changed is tracked
- After revert, a smoke test confirms captcha and OTP are enforced again
