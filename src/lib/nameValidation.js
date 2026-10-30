export function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function readNameForm(formData) {
  return {
    name: cleanText(formData.get("name")),
    description: cleanText(formData.get("description")),
  };
}

export function validateNameForm(values, noun) {
  const errors = {};
  if (!values.name) errors.name = `${noun} name is required.`;
  return errors;
}
