export const resFormat = (
  status: number,
  message: string,
  jsonResponse: unknown = null,
  output: number = 1,
  token?: string
) => ({
  status,
  message,
  jsonResponse,
  output,
  ...(token && { token }),
});
