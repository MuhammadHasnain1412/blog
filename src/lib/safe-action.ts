import { z } from "zod";
import { getCurrentUser } from "@/lib/rbac";

export function createSafeAction<TInput, TOutput>(
  schema: z.ZodSchema<TInput>,
  handler: (
    validatedData: TInput,
    userId: string,
    originalInput: FormData | Record<string, unknown>,
  ) => Promise<TOutput>,
) {
  return async (
    _prevState: unknown,
    formData: FormData | unknown,
  ): Promise<{ message?: string; success?: boolean; data?: TOutput }> => {
    try {
      const user = await getCurrentUser();
      if (!user) return { message: "Unauthorized", success: false };

      const userId = user.id;

      const dataToValidate: unknown =
        formData instanceof FormData
          ? Object.fromEntries(formData.entries())
          : formData;

      const validatedData = schema.parse(dataToValidate);
      const result = await handler(
        validatedData,
        userId,
        formData as FormData | Record<string, unknown>,
      );
      return { success: true, data: result };
    } catch (e: unknown) {
      if (e instanceof z.ZodError) {
        return { message: e.issues[0].message, success: false };
      }
      if (e && typeof e === "object" && "digest" in e) throw e;
      console.error(e);
      return { message: "An unexpected error occurred.", success: false };
    }
  };
}
