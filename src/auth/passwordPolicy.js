export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 64;

export const validatePasswordPolicy = (username, password) => {
  const value = String(password || "");
  const normalizedPassword = value.toLowerCase();
  const normalizedUsername = String(username || "").trim().toLowerCase();
  const reservedTerms = ["ecust", "ship", "marine", "board", "backend", "system", "admin", "operator", "viewer", "password"];
  const commonPasswords = new Set(["12345678", "123456789", "qwerty123"]);

  if (Array.from(value).length < PASSWORD_MIN_LENGTH || Array.from(value).length > PASSWORD_MAX_LENGTH) {
    return "密码需为 12-64 位，并包含大写字母、小写字母、数字和特殊字符";
  }
  if (commonPasswords.has(normalizedPassword) || (normalizedUsername && normalizedPassword.includes(normalizedUsername))) {
    return "密码不能使用常见密码或包含用户名";
  }
  if (reservedTerms.some((term) => normalizedPassword.includes(term))) {
    return "密码不能包含系统名称或默认角色名称";
  }
  if (/\s|\p{C}/u.test(value)) {
    return "密码不能包含空格或控制字符";
  }

  let hasUpper = false;
  let hasLower = false;
  let hasDigit = false;
  let hasSpecial = false;
  for (const character of value) {
    if (/\p{Lu}/u.test(character)) hasUpper = true;
    else if (/\p{Ll}/u.test(character)) hasLower = true;
    else if (/\p{N}/u.test(character)) hasDigit = true;
    else hasSpecial = true;
  }
  if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
    return "密码需包含大写字母、小写字母、数字和特殊字符";
  }
  return "";
};
