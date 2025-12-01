# E2E Tests - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies

```bash
npm install
npx playwright install
```

### Step 2: Start Development Server

```bash
# In one terminal
npm run dev
```

### Step 3: Run Tests

```bash
# In another terminal
npm run test:e2e
```

That's it! 🎉

---

## 📺 Demo Mode (For Stakeholders)

Want to show the tests to product owners or stakeholders?

```bash
# Interactive UI mode (BEST for demos)
npm run test:e2e:ui
```

This opens a visual interface where you can:
- ✅ See all test scenarios
- ✅ Run tests with one click
- ✅ Watch tests execute in real-time
- ✅ See what the user sees
- ✅ Pause and inspect at any point

---

## 🎬 Run Individual Scenarios

```bash
# Scenario 1: Complete Estimation Session
npx playwright test 01-complete-estimation-session --headed

# Scenario 2: GitHub Integration
npx playwright test 02-github-integration --headed

# Scenario 3: Real-time Collaboration
npx playwright test 03-real-time-collaboration --headed

# Scenario 4: Project & Team Management
npx playwright test 04-project-team-management --headed

# Scenario 5: Session History & Export
npx playwright test 05-session-history-export --headed
```

---

## 🐌 Slow Motion (For Presentations)

```bash
# Run tests slowly so people can see what's happening
npx playwright test --headed --slow-mo=1000
```

---

## 📊 View Test Report

After running tests:

```bash
npm run test:e2e:report
```

This opens an HTML report showing:
- ✅ Which tests passed/failed
- ✅ Screenshots of failures
- ✅ Videos of test execution
- ✅ Detailed traces for debugging

---

## 🎯 What Each Scenario Tests

### 1️⃣ Complete Estimation Session
**Time**: ~2 minutes  
**Shows**: Full planning poker workflow from project creation to finalized estimates

### 2️⃣ GitHub Integration
**Time**: ~1.5 minutes  
**Shows**: Importing GitHub issues and syncing estimates back

### 3️⃣ Real-time Collaboration
**Time**: ~2 minutes  
**Shows**: Multiple users voting simultaneously with live updates

### 4️⃣ Project & Team Management
**Time**: ~2 minutes  
**Shows**: Creating projects, inviting team members, managing roles

### 5️⃣ Session History & Export
**Time**: ~1.5 minutes  
**Shows**: Viewing past sessions and exporting data as JSON/CSV

**Total Demo Time**: ~9 minutes for all scenarios

---

## 🔧 Troubleshooting

### Tests Won't Start?

```bash
# Make sure dev server is running
npm run dev

# In another terminal
npm run test:e2e
```

### Need to Debug a Failing Test?

```bash
npm run test:e2e:debug
```

### Want to See What Happened?

```bash
# View the HTML report
npm run test:e2e:report
```

---

## 💡 Pro Tips

1. **Use UI Mode for demos** - It's the most visual and impressive
2. **Run with --headed** to see the browser
3. **Use --slow-mo** for presentations
4. **Check the report** after failures
5. **Run one scenario at a time** for focused demos

---

## 📚 More Information

- Full documentation: `e2e/README.md`
- Test summary: `E2E_TESTS_SUMMARY.md`
- Playwright docs: https://playwright.dev

---

## 🎉 Ready to Impress!

Your E2E tests are ready to demonstrate the full power of your Agile Planning Tool to stakeholders, product owners, and team members.

**Happy Testing!** 🚀
