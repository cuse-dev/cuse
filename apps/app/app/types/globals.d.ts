export {};

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      onboardingComplete?: boolean;
      plan?: string;
    };
    org_metadata: {
      plan?: string;
    };
  }
}
