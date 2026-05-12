const MESSAGES = {
  en: {
    sessionExpired: "Your session has expired. Please log in again.",
    connection: "Could not connect to the server. Please try again.",
    invalidCredentials: "Invalid email or password.",
    invalidOldPassword: "The current password is incorrect.",
    passwordMin: "Password must be at least 10 characters.",
    passwordLettersDigits: "Password must contain both letters and numbers.",
    passwordTooWeak: "This password is too weak. Please choose a stronger one.",
    passwordTooLong: "Password is too long. Use 72 bytes or less.",
    emailExists: "A user with this email or phone already exists.",
    invalidEmail: "Enter a valid email address.",
    resetToken: "The reset link is invalid or has expired.",
    imageType: "Upload a JPEG, PNG, GIF, or WebP image.",
    imageTooLarge: "The file is too large. Maximum size is 5 MB.",
    imageInvalid: "The selected file is not a valid image.",
    accessDenied: "You do not have access to this action.",
    server: "Something went wrong. Please try again.",
    required: "Please fill in the required fields.",
    invalidCode: "The confirmation code is incorrect or has expired.",
  },
  ru: {
    sessionExpired: "Сессия истекла. Пожалуйста, войдите заново.",
    connection: "Не удалось подключиться к серверу. Попробуйте ещё раз.",
    invalidCredentials: "Неверный email или пароль.",
    invalidOldPassword: "Текущий пароль введён неверно.",
    passwordMin: "Пароль должен быть не короче 10 символов.",
    passwordLettersDigits: "Пароль должен содержать буквы и цифры.",
    passwordTooWeak: "Этот пароль слишком простой. Выберите более надёжный.",
    passwordTooLong: "Пароль слишком длинный. Используйте не больше 72 байт.",
    emailExists: "Пользователь с таким email или телефоном уже существует.",
    invalidEmail: "Введите корректный email.",
    resetToken: "Ссылка для сброса пароля недействительна или истекла.",
    imageType: "Загрузите изображение JPEG, PNG, GIF или WebP.",
    imageTooLarge: "Файл слишком большой. Максимум 5 MB.",
    imageInvalid: "Выбранный файл не является корректным изображением.",
    accessDenied: "У вас нет доступа к этому действию.",
    server: "Что-то пошло не так. Попробуйте ещё раз.",
    required: "Заполните обязательные поля.",
    invalidCode: "Код подтверждения неверный или истёк.",
  },
  kk: {
    sessionExpired: "Сессия аяқталды. Қайта кіріңіз.",
    connection: "Серверге қосылу мүмкін болмады. Қайталап көріңіз.",
    invalidCredentials: "Email немесе құпия сөз қате.",
    invalidOldPassword: "Ағымдағы құпия сөз қате енгізілді.",
    passwordMin: "Құпия сөз кемінде 10 таңбадан тұруы керек.",
    passwordLettersDigits: "Құпия сөзде әріптер мен сандар болуы керек.",
    passwordTooWeak: "Бұл құпия сөз тым әлсіз. Күрделірек құпия сөз таңдаңыз.",
    passwordTooLong: "Құпия сөз тым ұзын. 72 байттан аспасын.",
    emailExists: "Мұндай email немесе телефонмен пайдаланушы бар.",
    invalidEmail: "Дұрыс email енгізіңіз.",
    resetToken: "Құпия сөзді қалпына келтіру сілтемесі жарамсыз немесе мерзімі өткен.",
    imageType: "JPEG, PNG, GIF немесе WebP суретін жүктеңіз.",
    imageTooLarge: "Файл тым үлкен. Ең көбі 5 MB.",
    imageInvalid: "Таңдалған файл дұрыс сурет емес.",
    accessDenied: "Бұл әрекетке рұқсатыңыз жоқ.",
    server: "Қате орын алды. Қайталап көріңіз.",
    required: "Міндетті өрістерді толтырыңыз.",
    invalidCode: "Растау коды қате немесе мерзімі өткен.",
  },
};

function langKey(i18nOrT) {
  const language = i18nOrT?.language || i18nOrT?.i18n?.language || "ru";
  return language.startsWith("kk") ? "kk" : language.startsWith("en") ? "en" : "ru";
}

export function extractApiDetail(errorOrDetail) {
  const detail = errorOrDetail?.detail ?? errorOrDetail?.message ?? errorOrDetail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg || item?.message || String(item)).join(" ");
  }
  if (detail && typeof detail === "object") {
    return detail.msg || detail.message || JSON.stringify(detail);
  }
  return String(detail || "");
}

export function apiErrorMessage(errorOrDetail, i18nOrT) {
  const messages = MESSAGES[langKey(i18nOrT)] || MESSAGES.ru;
  const raw = extractApiDetail(errorOrDetail);
  const text = raw.toLowerCase();

  if (!raw || text === "failed to fetch") return messages.connection;
  if (text.includes("field required") || text.includes("required fields")) return messages.required;
  if (text.includes("invalid_delete_code") || text.includes("confirmation") || text.includes("неверный код")) return messages.invalidCode;
  if (text.includes("session") || text.includes("could not validate credentials")) return messages.sessionExpired;
  if (text.includes("invalid email or password")) return messages.invalidCredentials;
  if (text.includes("invalid old password") || text.includes("current password")) return messages.invalidOldPassword;
  if (text.includes("at least 10") || text.includes("string should have at least 10")) return messages.passwordMin;
  if (text.includes("letters and digits")) return messages.passwordLettersDigits;
  if (text.includes("too weak")) return messages.passwordTooWeak;
  if (text.includes("at most 72") || text.includes("too long")) return messages.passwordTooLong;
  if (text.includes("already exists") || text.includes("already registered")) return messages.emailExists;
  if (text.includes("valid email") || text.includes("email address")) return messages.invalidEmail;
  if (text.includes("invalid or expired token") || text.includes("reset link")) return messages.resetToken;
  if (text.includes("unsupported image") || text.includes("file must be") || text.includes("declared mime")) return messages.imageType;
  if (text.includes("too large") || text.includes("maximum size")) return messages.imageTooLarge;
  if (text.includes("invalid image")) return messages.imageInvalid;
  if (text.includes("access denied") || text.includes("forbidden") || text.includes("admin access")) return messages.accessDenied;
  if (text.includes("internal server") || text.includes("request failed") || text.includes("server error")) return messages.server;

  return raw;
}
