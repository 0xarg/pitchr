"use client";
import Image from "next/image";
import React, { useRef, useState } from "react";
import { uploadFile } from "./lib/action";
import axios from "axios";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const jd = useRef<HTMLTextAreaElement>(null);
  const [status, setStatus] = useState("");
  const [jobd, setJD] = useState("");
  const [prop, setProp] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setStatus(`File Selected: ${e.target.files[0].name}`);
    }
  };

  const handleJDChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJD(e.target.value);
    console.log(jobd);
  };

  const getProp = async () => {
    const formData = new FormData();
    formData.append("jd", jobd);
    formData.append("resumeId", "4");
    console.log(formData);
    const res = await axios.post("/api/proposal", formData);
    setProp(res.data.proposal);
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      setStatus("No selected File");
      return;
    }

    setStatus("Uploading");
    const formData = new FormData();
    formData.append("file", selectedFile);
    console.log(formData);
    const res = await axios.post("/api/upload", formData, {});

    if (res.status === 200) {
      setStatus("Uploaded");
      console.log(res.data);
      return;
    }
    setStatus("Failed in uploading the resume");
    console.log(res.data);
    return;
  };
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Lets Get Started with getting Best Proposals
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <button
            onClick={uploadFile}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Upload Resume
          </button>
          {status}
          <input
            className="border-2 border-white"
            onChange={handleFileChange}
            type="file"
          ></input>
          <button
            onClick={getProp}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Get Proposal
          </button>
          <textarea
            className="border-white border-2"
            ref={jd}
            onChange={handleJDChange}
          />

          <h1>Proposal: {prop}</h1>
        </div>
      </main>
    </div>
  );
}
