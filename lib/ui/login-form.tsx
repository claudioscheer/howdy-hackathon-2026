"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { LOGIN_PAGE } from "./copy";

interface InputFieldProps {
  id: string;
  testId: string;
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  type?: string;
}

function InputField({
  id,
  testId,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: InputFieldProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-xs font-bold uppercase tracking-[0.96px] text-[#5a5a5f]"
      >
        {label}
      </label>
      <input
        id={id}
        data-testid={testId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        className="rounded border border-[#e0e0e8] bg-white px-4 py-3 text-base text-black transition-colors focus:border-black focus:outline-none"
      />
    </div>
  );
}

export function LoginForm(): React.JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    router.push("/dashboard");
  }

  return (
    <form
      data-testid="login-form"
      onSubmit={handleSubmit}
      className="flex w-full max-w-md flex-col gap-6"
    >
      <InputField
        id="email"
        testId="email-input"
        label={LOGIN_PAGE.emailLabel}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={LOGIN_PAGE.emailPlaceholder}
        type="email"
      />

      <InputField
        id="password"
        testId="password-input"
        label={LOGIN_PAGE.passwordLabel}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={LOGIN_PAGE.passwordPlaceholder}
        type="password"
      />

      <button
        type="submit"
        data-testid="login-submit"
        className="inline-flex items-center justify-center rounded-full border border-black bg-white px-6 py-[14px] text-[13px] font-bold uppercase leading-[0.94] tracking-[1.17px] text-black transition-colors hover:bg-black hover:text-white cursor-pointer"
      >
        {LOGIN_PAGE.submitButton}
      </button>
    </form>
  );
}
