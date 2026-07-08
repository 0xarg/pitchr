// app/actions.ts (Server Component)
"use server";

import fs from "fs/promises";
import { revalidatePath } from "next/cache";

export async function uploadFile(formData: FormData) {
  const file = formData.get("file") as File;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  console.log(buffer);
}
