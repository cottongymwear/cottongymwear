import { printfulStatus } from "@/lib/printful";

export async function GET() {
  const status = await printfulStatus();
  return Response.json(status);
}
