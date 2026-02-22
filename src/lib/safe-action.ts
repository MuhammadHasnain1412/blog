import { z } from "zod";
import { getCurrentUser } from "@/lib/rbac";

export function createSafeAction<TInput, TOutput>(
  schema: z.ZodSchema<TInput>,
  handler: (
    validatedData: TInput,
    userId: string,
    originalInput: any,
  ) => Promise<TOutput>,
) {
  return async (
    prevState: any,
    formData: FormData | unknown,
  ): Promise<{ message?: string; success?: boolean; data?: TOutput }> => {
    try {
      // 1. Mandatory Session Verification inside the bridge
      const user = await getCurrentUser();

      if (!user) {
        return { message: "Unauthorized", success: false };
      }

      const userId = (user as any).id;

      let dataToValidate: unknown;

      if (formData instanceof FormData) {
        // Convert FormData to a plain object for Zod parsing
        dataToValidate = Object.fromEntries(formData.entries());
      } else {
        dataToValidate = formData;
      }

      // 2. Strict Zod parsing
      // Note: The schema itself must use .strict() if it's an object to strip unknown fields
      const validatedData = schema.parse(dataToValidate);

      // 3. Execute logic securely
      const result = await handler(validatedData, userId, formData);

      return { success: true, data: result };
    } catch (e: unknown) {
      if (e instanceof z.ZodError) {
        return {
          message: (e as any).errors[0].message,
          success: false,
        };
      }

      // Re-throw Next.js redirect/notFound errors
      if (e && typeof e === "object" && "digest" in e) {
        throw e;
      }

      console.error(e);
      return { message: "An unexpected error occurred.", success: false };
    }
  };
}
