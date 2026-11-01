import LoginForm from "./LoginForm";

const URL_ERRORS = {
  deactivated: "Your account has been deactivated.",
  demo: "Demo account is not set up correctly.",
};

export default async function LoginPage({ searchParams }) {
  const { error } = await searchParams;
  const initialError =
    typeof error === "string" ? (URL_ERRORS[error] ?? null) : null;

  return <LoginForm initialError={initialError} />;
}
