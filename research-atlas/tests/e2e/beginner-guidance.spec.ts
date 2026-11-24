import { expect, test } from '@playwright/test';

test('a beginner chooses an example, revisits it, or skips directly to Discover', async ({ page }) => {
  await page.goto('/#primer');
  const interest = page.getByRole('textbox', { name: 'Your interest', exact: true });
  await page.getByRole('button', { name: 'Student housing', exact: true }).click();
  await expect(interest).toHaveValue('Student housing');
  await page.getByRole('button', { name: 'Choose how to explore' }).click();
  await expect(page.getByRole('heading', { name: 'How would you like to start?' })).toBeFocused();
  await page.getByRole('button', { name: 'Change interest' }).click();
  await expect(interest).toHaveValue('Student housing');
  await page.route('https://api.openalex.org/works?**', route => route.fulfill({ json: { meta: { count: 0 }, results: [] } }));
  await page.getByRole('button', { name: /Skip for now/ }).click();
  await expect(page).toHaveURL(/#paper-search\?topic=Student\+housing$/);
});

test.describe('first visit and workspace orientation', () => {
  test.use({ storageState: {cookies:[],origins:[]} });
  test('the spotlight resumes, supports keyboard controls and remembers completion', async ({page})=>{
    await page.goto('/#overview');
    await page.getByRole('button',{name:'Take a quick tour'}).press('Enter');
    const coach=page.locator('.tour-coach');
    await expect(coach.getByRole('heading',{name:'Your starting point'})).toBeFocused();
    await coach.getByRole('button',{name:'Next',exact:true}).press('Enter');
    await expect(coach.getByRole('heading',{name:'Start a project'})).toBeFocused();
    await coach.getByRole('button',{name:'Back',exact:true}).press('Enter');
    await expect(coach.getByRole('heading',{name:'Your starting point'})).toBeFocused();
    await coach.getByRole('button',{name:'Next',exact:true}).press('Enter');
    await coach.getByRole('button',{name:'Close tour'}).press('Enter');
    await expect(page.getByRole('button',{name:'Resume tour'})).toBeFocused();
    await page.reload();
    await page.getByRole('button',{name:'Resume tour'}).click();
    await expect(coach.getByRole('heading',{name:'Start a project'})).toBeVisible();
    await coach.getByRole('button',{name:'Skip tour'}).press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
    await page.reload();
    await expect(page.getByRole('heading',{level:1})).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.goto('/#preferences');
    await page.getByRole('button',{name:'Replay workspace tour'}).click();
    for(const title of ['Your starting point','Start a project','Discover papers','Keep your sources','Do the research','Learn by doing','Explore where to publish']){
      await expect(coach.getByRole('heading',{name:title,exact:true})).toBeFocused();
      await expect(page.locator('.tour-target-ring')).toBeVisible();
      await coach.getByRole('button',{name:'Next',exact:true}).press('Enter');
    }
    await coach.getByRole('button',{name:'Finish tour'}).click();
    await expect(page.getByRole('button',{name:'Replay workspace tour'})).toBeFocused();
    await page.goto('/#overview');
    await expect(page.getByRole('heading',{level:1})).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
  test('focus workspace dismisses optional guidance and retains the preference on reload', async ({page})=>{
    await page.goto('/#overview');
    await page.getByRole('button',{name:'Take a quick tour'}).click();
    await page.getByLabel('Guidance mode').selectOption('expert');
    await expect(page.locator('.tour-coach')).toHaveCount(0);
    await page.reload();
    await expect(page.getByLabel('Guidance mode')).toHaveValue('expert');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.goto('/#preferences');
    await expect(page.getByRole('button',{name:'Replay workspace tour'})).toBeVisible();
  });
});

test('a learner sees the source example before interpreting it and can reveal a self-check', async ({ page }) => {
  await page.goto('/#guide');
  await page.getByRole('button', { name: 'Separate findings from interpretation' }).click();
  await expect(page.getByText(/A fictional abstract says 12 of 20/)).toBeVisible();
  const guidance = page.getByText(/A reader can locate the result/);
  await expect(guidance).toBeHidden();
  await page.getByText('Check your work', { exact: true }).press('Enter');
  await expect(guidance).toBeVisible();
});
