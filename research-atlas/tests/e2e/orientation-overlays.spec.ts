import { expect, test } from '@playwright/test';

test.use({storageState:{cookies:[],origins:[]}});
test('a new visitor can skip, revisit, or explore without creating a project', async ({page})=>{
  await page.goto('/');
  const welcome=page.getByRole('dialog',{name:'Welcome to Research Atlas'});
  await expect(welcome.getByRole('button',{name:'Take a quick tour'})).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(welcome).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading',{level:1})).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#projects');
  await expect(page.getByRole('button',{name:'Delete project',exact:true})).toHaveCount(0);
});
test('existing users keep their lessons and can replay without a first-visit welcome',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('atlas-workspace-tour-v1',JSON.stringify({status:'complete',step:8})));
  await page.goto('/');
  await expect(page.getByRole('button',{name:'New project',exact:true})).toBeEnabled();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#preferences');
  await page.getByRole('button',{name:'Replay workspace tour'}).click();
  const coach=page.locator('.tour-coach');
  await expect(coach).toBeVisible();
  // Simulate a feature hidden from this version of the navigation.
  await page.locator('[data-tour="new-project"]').evaluate(el=>el.removeAttribute('data-tour'));
  await coach.getByRole('button',{name:'Next',exact:true}).click();
  await expect(coach.getByRole('heading',{name:'Start a project'})).toBeFocused();
  await expect(page.locator('.tour-target-ring')).toBeHidden();
  await coach.getByRole('button',{name:'Skip tour'}).click();
  await expect(page.locator('.atlas-tour')).toHaveCount(0);
});
test('the filter drawer contains focus, keeps filters and restores its trigger',async({page})=>{
  await page.goto('/#paper-search');
  const trigger=page.getByRole('button',{name:/^Filters/});
  await trigger.click();
  const panel=page.getByRole('dialog',{name:'Filters',exact:true});
  await expect(panel).toBeVisible();
  expect(await page.evaluate(()=>getComputedStyle(document.body).overflow)).toBe('hidden');
  await panel.getByLabel('Published from').fill('2021');
  await panel.getByRole('button',{name:'Done'}).focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  expect(await panel.evaluate(el=>el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(page.getByRole('button',{name:'Remove filter From 2021'})).toBeVisible();
  await trigger.click();
  await expect(panel.getByLabel('Published from')).toHaveValue('2021');
  await panel.getByRole('button',{name:'Done'}).click();
  expect(await page.evaluate(()=>getComputedStyle(document.body).overflow)).not.toBe('hidden');
});
test('spotlight fits the viewport and respects reduced motion at every stop',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await page.getByRole('button',{name:'Take a quick tour'}).click();
  const coach=page.locator('.tour-coach');
  for(let i=0;i<7;i++){
    await expect(coach.getByRole('heading')).toBeFocused();
    const rect=await coach.boundingBox();
    const viewport=page.viewportSize()!;
    expect(rect && rect.x>=0 && rect.y>=0 && rect.x+rect.width<=viewport.width+1 && rect.y+rect.height<=viewport.height+1).toBeTruthy();
    expect(await page.locator('.tour-target-ring').evaluate(el=>parseFloat(getComputedStyle(el).transitionDuration))).toBeLessThan(0.001);
    await coach.getByRole('button',{name:'Next',exact:true}).press('Enter');
  }
  await coach.getByRole('button',{name:'Explore some papers'}).click();
  await expect(page.getByRole('search')).toBeVisible();
  await expect(coach).toHaveCount(0);
});
