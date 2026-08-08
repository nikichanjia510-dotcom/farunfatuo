import { expect, test } from '@playwright/test';

test('complete a level, ask the reviewed assistant and submit feedback', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /陪宝宝在游戏里/ })).toBeVisible();

  await page.getByRole('button', { name: /开始成长游戏/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: '我会陪同使用' }).click();
  await page.getByRole('button', { name: '开始这一关' }).first().click();

  const correctChoices = [
    '玩具收进矮柜，地面干净防滑',
    '照护者洗手，并核对食物和过敏信息',
    '托育人员核对家长或约定接送人',
  ];
  for (const [index, choice] of correctChoices.entries()) {
    await page.getByRole('button', { name: new RegExp(choice) }).click();
    await page
      .getByRole('button', {
        name: index === correctChoices.length - 1 ? '领取成长徽章' : '进入下一个情景',
      })
      .click();
  }
  await expect(page.getByRole('heading', { name: /完成“找安全”练习/ })).toBeVisible();

  await page.getByRole('button', { name: /托宝助手/ }).click();
  await page.getByRole('button', { name: '托育服务法现在生效了吗？' }).click();
  await expect(page.getByText(/仍处于草案审议阶段/)).toBeVisible();

  await page.getByRole('button', { name: '试用反馈', exact: true }).click();
  await page.getByRole('radio', { name: '5 星' }).click();
  await page.getByRole('button', { name: '界面友好' }).click();
  await page.getByLabel(/还有什么想告诉我们/).fill('关卡清楚，适合陪同体验。');
  await page.getByRole('button', { name: '匿名提交反馈' }).click();
  await expect(page.getByRole('heading', { name: '谢谢你帮助托宝变得更好' })).toBeVisible();
});

test('mobile viewport has no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
});
