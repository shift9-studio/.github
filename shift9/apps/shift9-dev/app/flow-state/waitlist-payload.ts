export function waitlistPayload(email: string, formData: FormData) {
  const website = formData.get("website");
  return {
    email,
    website: typeof website === "string" ? website : "",
  };
}
