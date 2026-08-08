const PHONE_PATTERN = /(?:^|\D)1[3-9]\d{9}(?:$|\D)/;
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const ID_CARD_PATTERN = /(?:^|\D)\d{17}[\dXx](?:$|\D)/;

export function containsPersonalIdentifier(value: string): boolean {
  return (
    PHONE_PATTERN.test(value) ||
    EMAIL_PATTERN.test(value) ||
    ID_CARD_PATTERN.test(value)
  );
}

export const privacyValidationMessage =
  '请删除手机号、邮箱、身份证号等可识别个人身份的信息后再提交。';
