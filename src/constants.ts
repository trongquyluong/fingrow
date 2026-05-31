import {
  QuizQuestion,
  QuizDifficulty,
  StockDef,
  LeagueTier,
  LeagueDivision,
  RankInfo,
  WalletCategory,
  ShopItem,
  WeeklyQuest,
} from "./types";

// ════════════════════════════════════════════════════════════════════════════
// QUIZ QUESTIONS — JC-level financial literacy (38 questions)
// Sources: Jump$tart Coalition, CFPB Building Blocks, OECD/INFE,
//          Singapore's MAS MoneySense, IFEC
// ════════════════════════════════════════════════════════════════════════════
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // ───── COMPOUND INTEREST & TIME VALUE OF MONEY ─────
  {
    id: "ci-01",
    category: "Compound Interest",
    question: "Maya invests $1,000 at age 18 in an index fund averaging 8% per year and never adds another cent. Liam waits until 28 and invests the same $1,000 at the same 8%. At age 58, roughly how much more does Maya have than Liam?",
    options: ["About the same", "Roughly 2x more", "Roughly 5x more", "Roughly 10x more"],
    correctAnswer: 1,
    explanation: "Maya's money compounds for 40 years to about $21,700, while Liam's grows for only 30 years to about $10,000. Starting a decade earlier roughly doubles the final amount — time in the market beats timing the market.",
  },
  {
    id: "ci-02",
    category: "Compound Interest",
    question: "Using the Rule of 72, about how long does it take money to double at a 6% annual return?",
    options: ["6 years", "12 years", "18 years", "24 years"],
    correctAnswer: 1,
    explanation: "Divide 72 by the annual return percentage to estimate doubling time. 72 ÷ 6 = 12 years. It's a quick mental shortcut for evaluating any investment or savings rate.",
  },
  {
    id: "ci-03",
    category: "Compound Interest",
    question: "A bank advertises a savings account at '4% APY' and another at '4% APR compounded monthly'. Which actually pays more?",
    options: ["The 4% APY account", "The 4% APR account", "They pay the same", "Cannot tell without more info"],
    correctAnswer: 1,
    explanation: "APY already includes compounding, but 4% APR compounded monthly works out to about 4.07% APY. Always compare accounts using APY — it's the apples-to-apples number.",
  },
  {
    id: "ci-04",
    category: "Compound Interest",
    question: "Jin saves $200/month from age 20–30 (then stops). Priya saves $200/month from age 30–60. Both earn 7%/year. Who has more at 60?",
    options: ["Priya — she contributed 3x more", "Jin — his earlier money compounded longer", "Exactly the same", "Impossible to compare"],
    correctAnswer: 1,
    explanation: "Jin ends up with ~$245k vs Priya's ~$244k — despite contributing only $24k vs her $72k. Compounding rewards early starts so dramatically that less money invested sooner can beat more invested later.",
  },
  {
    id: "ci-05",
    category: "Compound Interest",
    question: "Which scenario best demonstrates the 'time value of money'?",
    options: [
      "A $1,000 phone is cheaper than a $1,200 phone",
      "Receiving $1,000 today is worth more than $1,000 in 5 years",
      "Older coins are worth more",
      "Spending money quickly is more enjoyable",
    ],
    correctAnswer: 1,
    explanation: "A dollar today can be invested and grow, while a dollar in the future loses value to inflation and missed earning potential. This principle is the foundation behind interest rates, loans, and investment decisions.",
  },
  {
    id: "ci-06",
    category: "Compound Interest",
    question: "You invest $5,000 at 10%/year. After 20 years, what's the difference between simple and compound interest?",
    options: [
      "Simple: $15k; Compound: $15k (no difference)",
      "Simple: $15k; Compound: ~$33.6k",
      "Simple: $33.6k; Compound: $15k",
      "Both grow to ~$50k",
    ],
    correctAnswer: 1,
    explanation: "Simple interest only pays on the original $5,000 (5,000 + 5,000×0.10×20 = $15,000). Compound interest pays interest on previously earned interest, growing to about $33,600. The gap widens over longer periods.",
  },

  // ───── BUDGETING ─────
  {
    id: "bg-01",
    category: "Budgeting",
    question: "Under the 50/30/20 rule, how should you allocate take-home pay?",
    options: [
      "50% wants, 30% needs, 20% savings",
      "50% needs, 30% wants, 20% savings/debt",
      "50% savings, 30% needs, 20% wants",
      "50% needs, 30% savings, 20% wants",
    ],
    correctAnswer: 1,
    explanation: "50% to needs (rent, food, transport, insurance), 30% to wants (dining out, streaming, hobbies), 20% to savings and debt repayment. It's a starting framework — adjust the ratios to your life stage.",
  },
  {
    id: "bg-02",
    category: "Budgeting",
    question: "You earn $2,000/month from a part-time job. Which is most clearly a 'want' rather than a 'need'?",
    options: ["Bus pass to get to school", "Basic mobile data plan", "Spotify Premium subscription", "Groceries for the week"],
    correctAnswer: 2,
    explanation: "Needs are things required to live, work, or study; wants enhance lifestyle. Spotify is replaceable by the free tier, while transport, basic data, and food are typically needs. Honest categorization is the first step to a real budget.",
  },
  {
    id: "bg-03",
    category: "Budgeting",
    question: "You stick to your budget for 3 weeks, then blow $300 on a concert ticket. What's the healthiest response?",
    options: [
      "Give up — budgeting isn't for you",
      "Adjust next month's 'wants' to absorb the overspend and continue",
      "Take out a payday loan to cover it",
      "Cut all spending to zero for the rest of the month",
    ],
    correctAnswer: 1,
    explanation: "A budget is a flexible plan, not a punishment. Recalibrate — cut wants elsewhere or extend recovery over a couple of months. People who treat slip-ups as data, not failure, stick with budgeting long-term.",
  },
  {
    id: "bg-04",
    category: "Budgeting",
    question: "What is 'lifestyle inflation' and why is it dangerous?",
    options: [
      "When inflation makes everything more expensive",
      "When spending rises with every raise, preventing wealth-building",
      "When luxury brands rise faster than regular goods",
      "When you spend more during holidays",
    ],
    correctAnswer: 1,
    explanation: "Lifestyle creep is when each pay raise gets absorbed by nicer rent, cars, and dining — leaving savings flat. The wealth-building trick: bank at least half of every raise before adjusting your standard of living.",
  },
  {
    id: "bg-05",
    category: "Budgeting",
    question: "Which method best controls impulse spending on food delivery apps?",
    options: [
      "Zero-based budgeting where every dollar has a job",
      "No budget — just spend what feels right",
      "Envelope (or digital sub-account) where the food budget runs out visibly",
      "Only budget once a year",
    ],
    correctAnswer: 2,
    explanation: "The envelope method — cash envelopes or digital sub-accounts — creates a hard visual limit. When the food envelope hits zero, you stop. It works best for categories you tend to overspend.",
  },

  // ───── CREDIT & DEBT ─────
  {
    id: "cr-01",
    category: "Credit & Debt",
    question: "Your card balance is $2,000 at 24% APR. You pay only the $40 minimum monthly. Roughly how long to pay it off?",
    options: ["About 1 year", "About 3 years", "Over 9 years", "Forever"],
    correctAnswer: 2,
    explanation: "At a 2% minimum on a 24% APR balance, almost all your payment goes to interest. You'd pay for over 9 years and roughly double the original balance in interest. Minimum payments are designed to keep you in debt.",
  },
  {
    id: "cr-02",
    category: "Credit & Debt",
    question: "Which action most directly HURTS your credit score?",
    options: [
      "Checking your own score",
      "Paying balance in full monthly",
      "Missing a payment by 30+ days",
      "Using 10% of your limit",
    ],
    correctAnswer: 2,
    explanation: "Payment history is the largest factor (~35%) in credit scores. A single 30-day-late mark can drop a good score by 50–100 points and stays on your report for 7 years. Checking your own score is a soft inquiry and never hurts.",
  },
  {
    id: "cr-03",
    category: "Credit & Debt",
    question: "Your limit is $5,000. What balance keeps 'credit utilization' in the ideal range?",
    options: ["Below $500 (under 10%)", "About $2,500 (~50%)", "About $4,500 (~90%)", "Utilization doesn't matter"],
    correctAnswer: 0,
    explanation: "Credit utilization (balance ÷ limit) is the second-biggest scoring factor. Keeping it below 10–30% signals responsible use. Maxed-out cards can drop your score by 50+ points even if you eventually pay them off.",
  },
  {
    id: "cr-04",
    category: "Credit & Debt",
    question: "You're tempted by a $400 jacket using Klarna's 'Pay in 4'. What's the most overlooked risk?",
    options: [
      "BNPL doesn't exist anymore",
      "Missing a payment can trigger late fees and credit bureau reports",
      "Klarna charges 30% interest on Pay-in-4",
      "BNPL can never be refunded",
    ],
    correctAnswer: 1,
    explanation: "BNPL feels free because there's no upfront interest, but late fees pile up fast and many providers now report to credit bureaus. Stacking multiple BNPL plans across apps is the #1 way young adults sleepwalk into debt.",
  },
  {
    id: "cr-05",
    category: "Credit & Debt",
    question: "What does APR stand for, and what does it represent?",
    options: [
      "Annual Payment Required",
      "Average Purchase Rate",
      "Annual Percentage Rate — the yearly cost of borrowing",
      "Authorized Payment Rate",
    ],
    correctAnswer: 2,
    explanation: "APR is the yearly interest rate charged on unpaid balances. A 24% APR means a $1,000 balance costs about $20/month in interest. If you pay the statement balance in full each month, you're charged $0 in interest.",
  },
  {
    id: "cr-06",
    category: "Credit & Debt",
    question: "Which debt payoff strategy saves the most money mathematically?",
    options: [
      "Snowball: smallest balance first",
      "Avalanche: highest interest rate first",
      "Equal amounts to all debts",
      "Pay only minimums and invest the rest",
    ],
    correctAnswer: 1,
    explanation: "Avalanche targets the highest APR first, minimizing total interest. Snowball (smallest balance first) gives faster wins but costs more. Pick avalanche for math, snowball for motivation — both beat doing nothing.",
  },

  // ───── SAVING ─────
  {
    id: "sv-01",
    category: "Saving",
    question: "How much should a typical emergency fund hold?",
    options: ["1 week of expenses", "3–6 months of essential expenses", "1 year of total income", "Whatever's left"],
    correctAnswer: 1,
    explanation: "3–6 months of essential expenses (rent, food, utilities, insurance, minimum debt) cushions job loss, medical bills, or surprise repairs without forcing you into high-interest debt. Build $1,000 first, then expand.",
  },
  {
    id: "sv-02",
    category: "Saving",
    question: "A high-yield savings account (HYSA) pays 4.5% APY; traditional pays 0.05%. On $5,000 over one year, what's the difference?",
    options: ["About $2", "About $25", "About $222", "About $1,000"],
    correctAnswer: 2,
    explanation: "$5,000 × 4.5% = $225 vs $5,000 × 0.05% = $2.50, a difference of about $222/year for the same money. Online HYSAs from regulated banks are FDIC/SDIC-insured just like traditional banks.",
  },
  {
    id: "sv-03",
    category: "Saving",
    question: "Where is the best place to keep an emergency fund?",
    options: [
      "Invested in volatile crypto for higher returns",
      "In an HYSA or money-market fund — liquid and stable",
      "Locked in a 10-year fixed deposit",
      "In cash hidden at home",
    ],
    correctAnswer: 1,
    explanation: "Emergency funds need to be liquid (accessible within a day or two) and stable. HYSAs and money-market funds offer both, plus modest interest. Investing emergency money risks selling at a loss exactly when you need it most.",
  },
  {
    id: "sv-04",
    category: "Saving",
    question: "You auto-transfer $200 to savings the day you're paid. What behavioral principle is this?",
    options: ["Compound interest", "Pay yourself first", "Diversification", "Dollar-cost averaging"],
    correctAnswer: 1,
    explanation: "'Pay yourself first' means treating savings like a non-negotiable bill before discretionary spending. Automating it removes willpower from the equation — you can't spend what you never see in your checking account.",
  },

  // ───── INVESTING ─────
  {
    id: "iv-01",
    category: "Investing",
    question: "What is an ETF (Exchange-Traded Fund)?",
    options: [
      "A single stock that trades on multiple exchanges",
      "A bundle of many stocks or bonds that trades like one stock",
      "A high-interest savings account",
      "A type of cryptocurrency",
    ],
    correctAnswer: 1,
    explanation: "An ETF holds dozens to thousands of underlying assets — an S&P 500 ETF gives you a slice of 500 large US companies in a single share. ETFs offer instant diversification at very low cost (often under 0.1%/year).",
  },
  {
    id: "iv-02",
    category: "Investing",
    question: "Why is diversification important?",
    options: [
      "It guarantees higher returns",
      "It eliminates all risk",
      "It reduces the impact of any single investment failing",
      "It avoids taxes",
    ],
    correctAnswer: 2,
    explanation: "Owning many different assets across companies, sectors, and countries means one company's collapse won't sink your portfolio. It can't eliminate market-wide risk, but it removes the unnecessary 'single-stock' risk for free.",
  },
  {
    id: "iv-03",
    category: "Investing",
    question: "A TikTok influencer promises 'guaranteed 25% monthly returns' on a new crypto token. What's most likely?",
    options: [
      "A legitimate high-performing investment",
      "A Ponzi scheme or pump-and-dump scam",
      "A government bond",
      "A normal index fund return",
    ],
    correctAnswer: 1,
    explanation: "No legitimate investment guarantees returns, and 25%/month (~1,355% annualized) is mathematically impossible to sustain. 'Guaranteed' + 'unusually high' + 'social media hype' = classic scam pattern. Real long-term stock returns average ~7–10%/year.",
  },
  {
    id: "iv-04",
    category: "Investing",
    question: "What does 'dollar-cost averaging' mean?",
    options: [
      "Buying only at the lowest price",
      "Investing a fixed amount on a regular schedule, regardless of price",
      "Converting investments to US dollars",
      "Averaging the cost of items in your cart",
    ],
    correctAnswer: 1,
    explanation: "Auto-investing a fixed amount monthly buys more shares when prices are low and fewer when high. It removes emotion and the impossible task of timing the market.",
  },
  {
    id: "iv-05",
    category: "Investing",
    question: "Generally, what's the relationship between risk and expected return?",
    options: [
      "Higher risk always means higher actual returns",
      "Higher potential return typically requires higher risk",
      "Lower risk gives higher return",
      "Risk and return are unrelated",
    ],
    correctAnswer: 1,
    explanation: "To compensate investors for the chance of loss, riskier assets must offer the possibility of higher returns. 'Potential' is key: high risk can also deliver big losses, which is why time horizon and diversification matter.",
  },
  {
    id: "iv-06",
    category: "Investing",
    question: "You have $500 and a 30-year time horizon. Most sensible first investment for a beginner?",
    options: [
      "A meme stock from Reddit",
      "A low-cost broad-market index ETF",
      "A leveraged 3x crypto futures contract",
      "Penny stocks under $1",
    ],
    correctAnswer: 1,
    explanation: "A broad-market index ETF (e.g., S&P 500 or MSCI World) gives instant diversification, very low fees, and solid long-term returns. Concentrated bets and leverage can wipe out beginners before they learn — start boring, get rich slowly.",
  },

  // ───── INFLATION ─────
  {
    id: "in-01",
    category: "Inflation",
    question: "Inflation is 3%/year and your savings pays 1%. What's happening to your purchasing power?",
    options: [
      "Growing by 1%/year",
      "Growing by 4%/year",
      "Effectively shrinking by ~2%/year",
      "Staying exactly the same",
    ],
    correctAnswer: 2,
    explanation: "Real return = nominal return − inflation. 1% − 3% = −2%, meaning your money buys 2% less each year despite the balance going up. Beating inflation is why people invest rather than only saving.",
  },
  {
    id: "in-02",
    category: "Inflation",
    question: "A bubble tea cost $4 in 2020 and $5 in 2025. This is most directly an example of:",
    options: ["Deflation", "Inflation", "A stock split", "Diversification"],
    correctAnswer: 1,
    explanation: "Inflation is the general rise in prices over time. Over 5 years, bubble tea inflated about 25% — roughly 4.6%/year, close to recent global averages.",
  },
  {
    id: "in-03",
    category: "Inflation",
    question: "Which asset has historically done the WORST at beating inflation over multi-decade periods?",
    options: ["Cash under a mattress", "A diversified stock portfolio", "Real estate", "A broad index fund"],
    correctAnswer: 0,
    explanation: "Cash earns 0% nominal return, so it loses purchasing power every year inflation is positive. Over 30 years at 3% inflation, $100 in cash becomes worth about $41 in today's purchasing power.",
  },

  // ───── TAXES ─────
  {
    id: "tx-01",
    category: "Taxes",
    question: "You move into a higher tax bracket after a raise. Is your ENTIRE income now taxed at the higher rate?",
    options: [
      "Yes — all income at the new bracket",
      "No — only income ABOVE the threshold is taxed at the higher rate",
      "Yes, but only for the first year",
      "No — moving brackets reduces overall taxes",
    ],
    correctAnswer: 1,
    explanation: "Most countries use marginal (progressive) brackets: each slice of income is taxed at its own rate. A raise always leaves you with more take-home pay — refusing a raise to 'stay in a lower bracket' is a myth.",
  },
  {
    id: "tx-02",
    category: "Taxes",
    question: "What's the difference between a tax deduction and a tax credit?",
    options: [
      "They're identical",
      "Deduction reduces taxable income; credit reduces tax owed dollar-for-dollar",
      "Credit reduces income; deduction reduces tax",
      "Only one is legal",
    ],
    correctAnswer: 1,
    explanation: "A $1,000 deduction at a 20% tax rate saves you $200. A $1,000 credit saves you the full $1,000. Credits are generally more valuable per dollar — which is why governments use them to incentivize behaviors like education or green energy.",
  },
  {
    id: "tx-03",
    category: "Taxes",
    question: "You sell a stock held for 2 years at $1,000 profit. In most tax systems, this is called:",
    options: ["Earned income", "A long-term capital gain", "A dividend", "A tax-free windfall"],
    correctAnswer: 1,
    explanation: "Profit from selling an investment is a capital gain — 'long-term' usually if held over a year, often taxed at a lower rate than short-term gains or salary. Singapore has no capital gains tax for individuals; most others (US, UK, Australia) do.",
  },
  {
    id: "tx-04",
    category: "Taxes",
    question: "Your part-time job pays $1,500 but you see $1,275 in your account. The $225 most likely went to:",
    options: [
      "Your employer's profits",
      "Income tax and/or mandatory contributions (CPF, Social Security)",
      "A bank processing fee",
      "An automatic charity donation",
    ],
    correctAnswer: 1,
    explanation: "Employers withhold income tax and statutory contributions (CPF in Singapore, Social Security in the US) before depositing net pay. Reading your payslip line-by-line is one of the most useful adulting habits.",
  },

  // ───── INSURANCE ─────
  {
    id: "is-01",
    category: "Insurance",
    question: "What is an insurance 'deductible' (or 'excess')?",
    options: [
      "The monthly amount to keep the policy active",
      "The amount you pay before insurance starts covering a claim",
      "A tax break from buying insurance",
      "The max the insurer will ever pay",
    ],
    correctAnswer: 1,
    explanation: "A deductible is your share before insurance kicks in. Higher deductibles mean lower premiums but more out-of-pocket risk. The monthly payment is the 'premium'; the max payout is the 'coverage limit'.",
  },
  {
    id: "is-02",
    category: "Insurance",
    question: "Your relative pressures you at 18 to buy whole-life insurance because 'it's an investment'. The more financially sound view?",
    options: [
      "Whole-life is always the best first product",
      "Term insurance + investing the difference is usually cheaper and more flexible",
      "Skip insurance entirely until 40",
      "Only buy insurance from TikTok",
    ],
    correctAnswer: 1,
    explanation: "Whole-life bundles insurance with a low-return investment and has very high fees. 'Buy term and invest the difference' typically yields better long-term wealth — especially for a young person with few dependents.",
  },
  {
    id: "is-03",
    category: "Insurance",
    question: "What's the main purpose of insurance?",
    options: [
      "To profit on premiums",
      "To transfer the risk of a rare, large loss in exchange for small regular payments",
      "To avoid taxes",
      "To replace a savings account",
    ],
    correctAnswer: 1,
    explanation: "Insurance is risk transfer, not investment. You pay a small predictable cost (premium) so the insurer absorbs a rare catastrophic cost. Insure what you can't afford to lose; self-insure with savings what you can.",
  },

  // ───── SCAMS & FRAUD ─────
  {
    id: "sc-01",
    category: "Scams & Fraud",
    question: "You get a WhatsApp from 'DBS Bank' saying your account is locked and you need to click a link to verify. What should you do?",
    options: [
      "Click and enter details quickly",
      "Reply asking if it's real",
      "Ignore the link and contact the bank through official app/hotline",
      "Forward to friends to warn them",
    ],
    correctAnswer: 2,
    explanation: "Banks never ask you to log in via SMS or WhatsApp links — classic phishing. Always navigate to the bank's official app or call the number on the back of your card. Forwarding the link risks others clicking it too.",
  },
  {
    id: "sc-02",
    category: "Scams & Fraud",
    question: "A 'recruiter' on Telegram offers $200/day to like TikTok videos and asks you to deposit $50 to 'unlock tasks'. Most likely:",
    options: [
      "A legitimate side hustle",
      "A job scam — never pay to get a job",
      "An internship program",
      "A government training subsidy",
    ],
    correctAnswer: 1,
    explanation: "Real employers pay YOU; they never ask you to pay them. Task scams are one of the fastest-growing frauds targeting teens, often escalating to thousand-dollar 'deposits' that disappear. If you must pay to earn, it's a scam.",
  },
  {
    id: "sc-03",
    category: "Scams & Fraud",
    question: "Strongest red flag of an investment scam?",
    options: [
      "Listed on a major regulated exchange",
      "Guaranteed returns + high urgency ('Invest today or miss out!')",
      "Publishes audited financials",
      "Requires identity verification (KYC)",
    ],
    correctAnswer: 1,
    explanation: "Guaranteed returns + artificial urgency is the universal scam signature. Real investments are regulated, audited, and never promise specific outcomes. MAS Investor Alert List (Singapore) and SEC EDGAR (US) are free tools to check legitimacy.",
  },

  // ───── CPF (Singapore) ─────
  {
    id: "cpf-01",
    category: "CPF",
    question: "What is Singapore's CPF (Central Provident Fund) mainly designed to help you fund?",
    options: ["Daily shopping and entertainment", "Retirement, housing and healthcare", "Overseas holidays", "Stock trading"],
    correctAnswer: 1,
    explanation: "CPF is a mandatory savings scheme that channels part of your salary into retirement (Ordinary & Special Accounts), housing, and healthcare (MediSave). It's the backbone of long-term financial security for Singaporeans.",
    difficulty: "easy",
  },
  {
    id: "cpf-02",
    category: "CPF",
    question: "For an employee under 55, what is the total CPF contribution rate (employee + employer share) on ordinary wages?",
    options: ["20%", "25%", "37%", "50%"],
    correctAnswer: 2,
    explanation: "It's 37% total — 20% from the employee plus 17% from the employer. That's a huge forced-savings rate, which is why understanding CPF early matters so much.",
    difficulty: "hard",
  },
  {
    id: "cpf-03",
    category: "CPF",
    question: "Which CPF account is used specifically for medical expenses and approved health insurance?",
    options: ["Ordinary Account (OA)", "Special Account (SA)", "MediSave Account (MA)", "Retirement Account (RA)"],
    correctAnswer: 2,
    explanation: "MediSave (MA) covers hospital bills, MediShield Life premiums and certain treatments. The OA is mainly for housing/education and the SA for retirement.",
    difficulty: "medium",
  },
  {
    id: "cpf-04",
    category: "CPF",
    question: "What does CPF LIFE provide?",
    options: ["A lump sum at age 55", "Monthly payouts for life from retirement age", "Free overseas travel insurance", "A government stock portfolio"],
    correctAnswer: 1,
    explanation: "CPF LIFE is a national annuity that pays you a monthly income for as long as you live, protecting you from outliving your savings.",
    difficulty: "medium",
  },

  // ───── BUDGETING ─────
  {
    id: "bg-03",
    category: "Budgeting",
    question: "Under the popular 50/30/20 budgeting rule, what does the 20% go to?",
    options: ["Wants like dining out", "Needs like rent", "Savings and debt repayment", "Taxes"],
    correctAnswer: 2,
    explanation: "50% needs, 30% wants, 20% savings/debt. The 20% is what actually builds your future — automate it before you spend on the rest.",
    difficulty: "easy",
  },
  {
    id: "bg-04",
    category: "Budgeting",
    question: "How big should a starter emergency fund typically be?",
    options: ["1 day of expenses", "3–6 months of expenses", "10 years of expenses", "Exactly $50"],
    correctAnswer: 1,
    explanation: "3–6 months of essential expenses is the standard buffer, so a job loss or big bill doesn't push you into high-interest debt. Build it before investing aggressively.",
    difficulty: "medium",
  },
  {
    id: "bg-05",
    category: "Budgeting",
    question: "Which of these is a 'need' rather than a 'want'?",
    options: ["The latest iPhone on launch day", "A bubble tea every afternoon", "Basic groceries and transport to school", "Concert tickets"],
    correctAnswer: 2,
    explanation: "Needs are essentials you can't easily skip (food, transport, basic housing). Telling needs from wants is the core skill behind every budget.",
    difficulty: "easy",
  },

  // ───── INVESTING ─────
  {
    id: "iv-05",
    category: "Investing",
    question: "Why do investors diversify across many companies and asset types?",
    options: ["To guarantee profits", "To reduce the impact if any single investment crashes", "To avoid paying tax", "To beat the market every year"],
    correctAnswer: 1,
    explanation: "Diversification spreads risk — one company failing won't wipe you out. It can't guarantee gains, but it smooths the ride. 'Don't put all your eggs in one basket.'",
    difficulty: "medium",
  },
  {
    id: "iv-06",
    category: "Investing",
    question: "Two index funds track the same market. Fund A charges a 0.05% expense ratio, Fund B charges 1.5%. Over 30 years, which is likely far better and why?",
    options: ["Fund B — higher fee means better management", "Fund A — lower fees compound into much higher returns", "They'll be identical", "Fund B — fees don't matter long-term"],
    correctAnswer: 1,
    explanation: "For index funds tracking the same thing, fees are one of the few things you control. A 1.45% yearly gap compounds into tens of thousands lost over decades. Low-cost wins.",
    difficulty: "hard",
  },
  {
    id: "iv-07",
    category: "Investing",
    question: "What is an ETF (Exchange-Traded Fund)?",
    options: ["A single company's share", "A basket of many assets you can buy as one fund on an exchange", "A type of bank loan", "A cryptocurrency"],
    correctAnswer: 1,
    explanation: "An ETF bundles many stocks/bonds into one tradable fund, giving instant diversification — often at very low cost. A broad-market ETF is a common beginner core holding.",
    difficulty: "easy",
  },
  {
    id: "iv-08",
    category: "Investing",
    question: "What is 'dollar-cost averaging'?",
    options: ["Timing the market perfectly", "Investing a fixed amount regularly regardless of price", "Only buying when prices are low", "Converting all money to US dollars"],
    correctAnswer: 1,
    explanation: "Investing the same amount on a schedule means you buy more units when cheap and fewer when expensive — removing the stress of timing and smoothing your average price.",
    difficulty: "medium",
  },

  // ───── CREDIT & DEBT ─────
  {
    id: "cr-06",
    category: "Credit & Debt",
    question: "How do you avoid paying any interest on a normal credit card?",
    options: ["Pay only the minimum each month", "Pay the full statement balance by the due date", "Never check the statement", "Withdraw cash from it"],
    correctAnswer: 1,
    explanation: "Pay the full balance every month and the grace period means $0 interest. Paying only the minimum is how balances snowball at ~25% p.a.",
    difficulty: "medium",
  },
  {
    id: "cr-07",
    category: "Credit & Debt",
    question: "A Buy-Now-Pay-Later app (e.g. Atome, Klarna) splits a $120 jacket into 3 payments. The main danger is:",
    options: ["It's always interest-free so there's no risk", "It makes overspending easy and stacks multiple hidden obligations", "It improves your credit score automatically", "It's illegal in Singapore"],
    correctAnswer: 1,
    explanation: "BNPL feels painless, which nudges you to buy more than you can afford and juggle several instalments at once. Missed payments bring fees — treat each split as real debt.",
    difficulty: "hard",
  },

  // ───── SAVING ─────
  {
    id: "sv-05",
    category: "Saving",
    question: "What does 'pay yourself first' mean?",
    options: ["Spend on yourself before bills", "Move money to savings as soon as you're paid, before spending", "Buy whatever you want first", "Pay friends back first"],
    correctAnswer: 1,
    explanation: "Automate savings the moment income arrives, then live on the rest. Saving what's 'left over' usually means nothing is left over.",
    difficulty: "easy",
  },

  // ───── INFLATION ─────
  {
    id: "in-03",
    category: "Inflation",
    question: "If inflation is 4% and your savings account pays 0.5%, what's really happening to your money?",
    options: ["It's growing in buying power", "It's losing buying power over time", "Nothing changes", "It doubles every year"],
    correctAnswer: 1,
    explanation: "When prices rise faster than your interest, each dollar buys less next year. Cash 'feels' safe but quietly loses value to inflation — a key reason people invest.",
    difficulty: "medium",
  },

  // ───── INSURANCE ─────
  {
    id: "is-04",
    category: "Insurance",
    question: "What's the key difference between term and whole-life insurance?",
    options: ["Term covers a set period and is cheaper; whole-life lasts for life and costs more", "Term is always more expensive", "They are identical", "Whole-life has no cash value"],
    correctAnswer: 0,
    explanation: "Term life covers a fixed window (e.g. 20 years) for a low premium — great for pure protection. Whole-life lasts your whole life and bundles savings, costing much more.",
    difficulty: "medium",
  },

  // ───── TAXES ─────
  {
    id: "tx-05",
    category: "Taxes",
    question: "Singapore uses a 'progressive' personal income tax. What does that mean?",
    options: ["Everyone pays the same flat rate", "Higher income is taxed at higher rates, in tiers", "Only foreigners pay tax", "Tax falls as you earn more"],
    correctAnswer: 1,
    explanation: "Income is taxed in bands — the first $20,000 is 0%, and each higher slice is taxed at a higher rate. Only the income within each band is taxed at that band's rate.",
    difficulty: "medium",
  },
  {
    id: "tx-06",
    category: "Taxes",
    question: "GST (Goods & Services Tax) in Singapore is an example of which kind of tax?",
    options: ["A tax on income you earn", "A consumption tax added when you buy goods/services", "A tax only companies pay", "A tax on savings"],
    correctAnswer: 1,
    explanation: "GST is charged on spending, so you pay it at checkout on most purchases. It's currently 9% in Singapore.",
    difficulty: "easy",
  },

  // ───── BANKING ─────
  {
    id: "bk-01",
    category: "Banking",
    question: "In Singapore, deposit insurance (SDIC) protects your bank savings up to roughly how much per bank if the bank fails?",
    options: ["S$1,000", "S$100,000", "Unlimited", "S$10 million"],
    correctAnswer: 1,
    explanation: "The SDIC scheme insures up to S$100,000 per depositor per bank. Spreading very large balances across banks keeps more of it protected.",
    difficulty: "medium",
  },

  // ───── SCAMS & FRAUD ─────
  {
    id: "sc-04",
    category: "Scams & Fraud",
    question: "You get an SMS: 'Your DBS account is locked. Verify now: dbs-secure-login.xyz'. Best move?",
    options: ["Tap the link and log in fast", "Ignore the link; open the official bank app or call the bank directly", "Reply with your password", "Forward it to friends"],
    correctAnswer: 1,
    explanation: "Banks never send login links by SMS. The odd domain is a phishing tell. Never click — go to the official app/site yourself. This is the most common scam hitting young Singaporeans.",
    difficulty: "medium",
  },
  {
    id: "sc-05",
    category: "Scams & Fraud",
    question: "A caller claiming to be from your bank asks you to read out the OTP just sent to your phone. You should:",
    options: ["Read it out to be helpful", "Never share the OTP — hang up", "Ask them to repeat it", "Share only half of it"],
    correctAnswer: 1,
    explanation: "An OTP is the key to your account. No real bank or official will ever ask for it. Sharing it lets scammers authorise transfers instantly. Hang up and report.",
    difficulty: "easy",
  },

  // ───── EXTRA HARD QUESTIONS (Daily Challenge pool) ─────
  {
    id: "ci-07",
    category: "Compound Interest",
    question: "$1,000 invested at 10% per year, compounded annually, grows to roughly how much after 10 years?",
    options: ["$1,100", "$2,000", "$2,594", "$10,000"],
    correctAnswer: 2,
    explanation: "1.10^10 ≈ 2.594, so $1,000 becomes about $2,594 — it more than doubles. Compounding makes growth accelerate, not stay linear.",
    difficulty: "hard",
  },
  {
    id: "iv-09",
    category: "Investing",
    question: "Fund A returns 9%/yr but charges 2% fees. Fund B (an index fund) returns 8%/yr with 0.1% fees. Which leaves you better off?",
    options: ["Fund A — 7.0% net", "Fund B — 7.9% net", "They're equal", "Can't tell"],
    correctAnswer: 1,
    explanation: "Net return = gross − fees. A: 9−2 = 7.0%. B: 8−0.1 = 7.9%. The lower-fee index fund wins despite a lower headline return — fees quietly compound against you.",
    difficulty: "hard",
  },
  {
    id: "rt-01",
    category: "Investing",
    question: "Using the '4% rule', roughly how much do you need invested to safely draw $40,000 a year in retirement?",
    options: ["$100,000", "$400,000", "$1,000,000", "$4,000,000"],
    correctAnswer: 2,
    explanation: "$40,000 ÷ 0.04 = $1,000,000. The 4% rule estimates a sustainable annual withdrawal, so your target nest egg is about 25× your yearly spending.",
    difficulty: "hard",
  },
  {
    id: "cr-09",
    category: "Credit & Debt",
    question: "You owe $2,000 on a card at 24% APR and pay only the ~2% minimum (~$40) each month. Roughly how long to clear it?",
    options: ["Under 1 year", "About 2 years", "Over 10 years", "3 months"],
    correctAnswer: 2,
    explanation: "At 24% interest, minimum payments barely outrun the interest, so a small balance can take over a decade and cost more than the original sum. Always pay more than the minimum.",
    difficulty: "hard",
  },
  {
    id: "tx-07",
    category: "Taxes",
    question: "Your marginal tax rate is 15% but your effective rate is 7%. What does this mean?",
    options: [
      "You overpaid your taxes",
      "Only your top slice of income is taxed at 15%; averaged over all income it's 7%",
      "They should always be the same",
      "Your effective rate is calculated wrongly",
    ],
    correctAnswer: 1,
    explanation: "In a progressive system, only income in the top band is taxed at 15% (your marginal rate). Averaged across all your income, the effective rate is lower — here 7%.",
    difficulty: "hard",
  },
  {
    id: "nw-01",
    category: "Budgeting",
    question: "You have $5,000 in savings, a car worth $20,000, and owe $12,000 in loans. What's your net worth?",
    options: ["$25,000", "$13,000", "$37,000", "$8,000"],
    correctAnswer: 1,
    explanation: "Net worth = assets − liabilities = ($5,000 + $20,000) − $12,000 = $13,000. It's what you'd have left if you sold everything and paid off all debt.",
    difficulty: "hard",
  },
  {
    id: "fx-01",
    category: "Banking",
    question: "If 1 USD = 1.35 SGD, a US$100 online game costs about how much in SGD (ignoring card fees)?",
    options: ["S$74", "S$100", "S$135", "S$1,350"],
    correctAnswer: 2,
    explanation: "US$100 × 1.35 = S$135. Foreign purchases convert at the exchange rate (plus a small bank/card fee), so the SGD cost is higher than the USD number.",
    difficulty: "hard",
  },
  {
    id: "mg-01",
    category: "Credit & Debt",
    question: "On a long home loan, in the EARLY years most of each monthly repayment goes toward:",
    options: ["The principal (amount borrowed)", "Interest", "Property tax", "Renovation costs"],
    correctAnswer: 1,
    explanation: "Loans are 'amortised' — early payments are mostly interest because the outstanding balance is largest. Only later does more go to principal. Extra early repayments save a lot of interest.",
    difficulty: "hard",
  },
];

// ════════════════════════════════════════════════════════════════════════════
// STOCKS
// ════════════════════════════════════════════════════════════════════════════
export const STOCKS: StockDef[] = [
  { id: "tch", name: "TechCorp",  ticker: "TCH", basePrice: 45.20, volatility: 0.13, color: "#60A5FA", description: "Leading tech company in AI & cloud computing" },
  { id: "fdb", name: "FoodBros",  ticker: "FDB", basePrice: 12.80, volatility: 0.07, color: "#22C55E", description: "Popular fast-food chain across Southeast Asia" },
  { id: "spt", name: "SportMax",  ticker: "SPT", basePrice: 28.50, volatility: 0.10, color: "#FB7185", description: "Sports gear & e-sports entertainment brand" },
  { id: "edu", name: "EduLearn",  ticker: "EDU", basePrice: 67.30, volatility: 0.08, color: "#A855F7", description: "Online education platform with 10M students" },
  { id: "grn", name: "GreenPow",  ticker: "GRN", basePrice: 33.10, volatility: 0.11, color: "#34D399", description: "Renewable energy: solar panels & EV charging" },
  { id: "cbv", name: "CoolBev",   ticker: "CBV", basePrice: 19.75, volatility: 0.06, color: "#FBBF24", description: "Premium beverage brand with global reach" },
];

// ════════════════════════════════════════════════════════════════════════════
// WALLET CATEGORIES — teen-friendly
// ════════════════════════════════════════════════════════════════════════════
export const WALLET_CATEGORIES: WalletCategory[] = [
  // expenses
  { id: "food",          name: "Food & Drinks",  icon: "🍔", color: "#F59E0B", type: "expense" },
  { id: "transport",     name: "Transport",      icon: "🚌", color: "#3B82F6", type: "expense" },
  { id: "entertainment", name: "Fun & Games",    icon: "🎮", color: "#A855F7", type: "expense" },
  { id: "shopping",      name: "Shopping",       icon: "🛍️", color: "#EC4899", type: "expense" },
  { id: "education",     name: "Education",      icon: "📚", color: "#10B981", type: "expense" },
  { id: "subscriptions", name: "Subscriptions",  icon: "🔁", color: "#6366F1", type: "expense" },
  { id: "health",        name: "Health & Beauty",icon: "💪", color: "#F43F5E", type: "expense" },
  { id: "gifts",         name: "Gifts Given",    icon: "🎁", color: "#EF4444", type: "expense" },
  { id: "savings",       name: "Savings",        icon: "💰", color: "#14B8A6", type: "expense" },
  { id: "other",         name: "Other",          icon: "✨", color: "#6B7280", type: "expense" },
  // income
  { id: "allowance",     name: "Allowance",      icon: "💵", color: "#10B981", type: "income" },
  { id: "job",           name: "Part-time Job",  icon: "💼", color: "#059669", type: "income" },
  { id: "gifts_in",      name: "Gifts Received", icon: "🎉", color: "#34D399", type: "income" },
  { id: "side",          name: "Side Hustle",    icon: "🚀", color: "#6EE7B7", type: "income" },
];

// ════════════════════════════════════════════════════════════════════════════
// AVATAR SHOP ITEMS — variants must match Avatar.tsx renderer.
// Rarity tints: common = free/cheap, rare = mid, epic = pricey, legendary = endgame.
// ════════════════════════════════════════════════════════════════════════════
export const SHOP_ITEMS: ShopItem[] = [
  // ───── FACE SHAPE ─────
  { id: "face-round",    name: "Round Face",      slot: "face",       cost: 0,    variant: "round",     description: "Soft and friendly.",       rarity: "common" },
  { id: "face-oval",     name: "Oval Face",       slot: "face",       cost: 200,  variant: "oval",      description: "Classic proportions.",      rarity: "rare" },
  { id: "face-square",   name: "Square Jaw",      slot: "face",       cost: 250,  variant: "square",    description: "Strong & confident.",       rarity: "rare" },
  { id: "face-heart",    name: "Heart Shape",     slot: "face",       cost: 250,  variant: "heart",     description: "Pointed chin charm.",       rarity: "rare" },

  // ───── EYES ─────
  { id: "eyes-bright",   name: "Bright Eyes",     slot: "eyes",       cost: 0,    variant: "bright",    description: "Big and sparkly.",          rarity: "common" },
  { id: "eyes-sharp",    name: "Sharp Eyes",      slot: "eyes",       cost: 150,  variant: "sharp",     description: "Focused & determined.",     rarity: "rare" },
  { id: "eyes-sleepy",   name: "Sleepy Eyes",     slot: "eyes",       cost: 150,  variant: "sleepy",    description: "Just woke up — and slaying.", rarity: "rare" },
  { id: "eyes-anime",    name: "Anime Eyes",      slot: "eyes",       cost: 350,  variant: "anime",     description: "Main character energy.",    rarity: "epic" },
  { id: "eyes-wink",     name: "Wink",            slot: "eyes",       cost: 400,  variant: "wink",      description: "Stay charming.",            rarity: "epic" },

  // ───── EYEBROWS ─────
  { id: "brows-natural", name: "Natural Brows",   slot: "brows",      cost: 0,    variant: "natural",   description: "The default.",              rarity: "common" },
  { id: "brows-bold",    name: "Bold Brows",      slot: "brows",      cost: 100,  variant: "bold",      description: "Statement piece.",          rarity: "common" },
  { id: "brows-arched",  name: "Arched Brows",    slot: "brows",      cost: 150,  variant: "arched",    description: "Sass on tap.",              rarity: "rare" },
  { id: "brows-thin",    name: "Thin Brows",      slot: "brows",      cost: 150,  variant: "thin",      description: "Refined look.",             rarity: "rare" },

  // ───── MOUTH ─────
  { id: "mouth-smile",   name: "Soft Smile",      slot: "mouth",      cost: 0,    variant: "smile",     description: "Welcoming grin.",           rarity: "common" },
  { id: "mouth-grin",    name: "Big Grin",        slot: "mouth",      cost: 120,  variant: "grin",      description: "Pure joy.",                 rarity: "common" },
  { id: "mouth-smirk",   name: "Smirk",           slot: "mouth",      cost: 180,  variant: "smirk",     description: "You know something.",       rarity: "rare" },
  { id: "mouth-pout",    name: "Pout",            slot: "mouth",      cost: 180,  variant: "pout",      description: "Cute & moody.",             rarity: "rare" },

  // ───── HAIR (always required) ─────
  { id: "hair-short",    name: "Short Hair",      slot: "hair",       cost: 0,    variant: "short",     description: "Clean classic cut.",        rarity: "common" },
  { id: "hair-long",     name: "Long Hair",       slot: "hair",       cost: 150,  variant: "long",      description: "Flowing locks.",            rarity: "common" },
  { id: "hair-curly",    name: "Curly Hair",      slot: "hair",       cost: 200,  variant: "curly",     description: "Big curls energy.",         rarity: "rare" },
  { id: "hair-bun",      name: "Top Knot",        slot: "hair",       cost: 250,  variant: "bun",       description: "Effortlessly cool.",        rarity: "rare" },
  { id: "hair-mohawk",   name: "Mohawk",          slot: "hair",       cost: 400,  variant: "mohawk",    description: "Punk vibes.",               rarity: "epic" },
  { id: "hair-ponytail", name: "Ponytail",        slot: "hair",       cost: 300,  variant: "ponytail",  description: "Ready for the game.",       rarity: "rare" },
  { id: "hair-afro",     name: "Afro",            slot: "hair",       cost: 450,  variant: "afro",      description: "Volume on volume.",         rarity: "epic" },
  { id: "hair-undercut", name: "Undercut",        slot: "hair",       cost: 350,  variant: "undercut",  description: "Modern street style.",      rarity: "epic" },
  { id: "hair-pixie",    name: "Pixie Cut",       slot: "hair",       cost: 300,  variant: "pixie",     description: "Short, sharp, iconic.",     rarity: "rare" },
  { id: "hair-twin",     name: "Twin Buns",       slot: "hair",       cost: 350,  variant: "twin",      description: "Double the buns, double the fun.", rarity: "epic" },

  // ───── HATS ─────
  { id: "hat-cap",       name: "Baseball Cap",    slot: "hat",        cost: 100,  variant: "cap",       description: "Sporty casual.",            rarity: "common", theme: "sport" },
  { id: "hat-beanie",    name: "Beanie",          slot: "hat",        cost: 150,  variant: "beanie",    description: "Cozy & warm.",              rarity: "common" },
  { id: "hat-grad",      name: "Graduation Cap",  slot: "hat",        cost: 500,  variant: "grad",      description: "Smart move.",               rarity: "epic", theme: "school" },
  { id: "hat-crown",     name: "Royal Crown",     slot: "hat",        cost: 1500, variant: "crown",     description: "Treat yourself like royalty.", rarity: "legendary", theme: "fantasy" },
  { id: "hat-tiara",     name: "Tiara",           slot: "hat",        cost: 1200, variant: "tiara",     description: "Sparkle bright.",           rarity: "legendary", theme: "fantasy" },
  { id: "hat-bucket",    name: "Bucket Hat",      slot: "hat",        cost: 200,  variant: "bucket",    description: "Festival ready.",           rarity: "rare" },
  { id: "hat-wizard",    name: "Wizard Hat",      slot: "hat",        cost: 900,  variant: "wizard",    description: "Cast spells, drop wisdom.", rarity: "epic", theme: "fantasy" },
  { id: "hat-headphone", name: "Headphones",      slot: "hat",        cost: 600,  variant: "headphone", description: "Vibes on demand.",          rarity: "epic" },

  // ───── GLASSES ─────
  { id: "glass-round",   name: "Round Glasses",   slot: "glasses",    cost: 200,  variant: "round",     description: "Smart academic look.",      rarity: "common", theme: "school" },
  { id: "glass-square",  name: "Square Frames",   slot: "glasses",    cost: 250,  variant: "square",    description: "Bold & modern.",            rarity: "rare" },
  { id: "glass-shades",  name: "Cool Shades",     slot: "glasses",    cost: 350,  variant: "shades",    description: "Future's so bright.",       rarity: "rare" },
  { id: "glass-vr",      name: "VR Headset",      slot: "glasses",    cost: 800,  variant: "vr",        description: "Welcome to the metaverse.", rarity: "epic", theme: "scifi" },
  { id: "glass-cat",     name: "Cat-Eye",         slot: "glasses",    cost: 400,  variant: "cat",       description: "Vintage chic.",             rarity: "epic" },
  { id: "glass-monocle", name: "Monocle",         slot: "glasses",    cost: 1000, variant: "monocle",   description: "Distinguished sir/madam.",  rarity: "legendary", theme: "fantasy" },

  // ───── OUTFITS ─────
  { id: "fit-tee",       name: "Plain Tee",       slot: "outfit",     cost: 0,    variant: "tee",       description: "Day one essentials.",       rarity: "common" },
  { id: "fit-hoodie",    name: "Hoodie",          slot: "outfit",     cost: 200,  variant: "hoodie",    description: "Streetwear staple.",        rarity: "common" },
  { id: "fit-suit",      name: "Business Suit",   slot: "outfit",     cost: 600,  variant: "suit",      description: "CEO energy.",               rarity: "epic" },
  { id: "fit-jersey",    name: "Sports Jersey",   slot: "outfit",     cost: 300,  variant: "jersey",    description: "Team spirit.",              rarity: "rare", theme: "sport" },
  { id: "fit-formal",    name: "Formal Dress",    slot: "outfit",     cost: 700,  variant: "formal",    description: "Ready for events.",         rarity: "epic" },
  { id: "fit-uniform",   name: "School Uniform",  slot: "outfit",     cost: 250,  variant: "uniform",   description: "Classic JC look.",          rarity: "rare", theme: "school" },
  { id: "fit-jacket",    name: "Bomber Jacket",   slot: "outfit",     cost: 450,  variant: "jacket",    description: "Layered up.",               rarity: "epic" },
  { id: "fit-tank",      name: "Tank Top",        slot: "outfit",     cost: 180,  variant: "tank",      description: "Gym ready.",                rarity: "rare", theme: "sport" },
  { id: "fit-armor",     name: "Knight Armor",    slot: "outfit",     cost: 1300, variant: "armor",     description: "For the brave.",            rarity: "legendary", theme: "fantasy" },
  { id: "fit-astro",     name: "Astronaut Suit",  slot: "outfit",     cost: 1100, variant: "astro",     description: "To the moon.",              rarity: "legendary", theme: "scifi" },

  // ───── ACCESSORIES (earrings, scarf, chains) ─────
  { id: "acc-none",      name: "None",            slot: "accessory",  cost: 0,    variant: "none",      description: "Keep it minimal.",          rarity: "common" },
  { id: "acc-studs",     name: "Stud Earrings",   slot: "accessory",  cost: 200,  variant: "studs",     description: "Tiny sparkle.",             rarity: "common" },
  { id: "acc-hoops",     name: "Hoop Earrings",   slot: "accessory",  cost: 280,  variant: "hoops",     description: "Bigger statement.",         rarity: "rare" },
  { id: "acc-chain",     name: "Gold Chain",      slot: "accessory",  cost: 600,  variant: "chain",     description: "Drip activated.",           rarity: "epic" },
  { id: "acc-scarf",     name: "Scarf",           slot: "accessory",  cost: 350,  variant: "scarf",     description: "Warm vibes.",               rarity: "rare" },
  { id: "acc-bowtie",    name: "Bow Tie",         slot: "accessory",  cost: 300,  variant: "bowtie",    description: "Dapper detail.",            rarity: "rare" },

  // ───── BACKGROUNDS ─────
  { id: "bg-default",    name: "Cosmic",          slot: "background", cost: 0,    variant: "cosmic",    description: "Starting in the stars.",    rarity: "common" },
  { id: "bg-sunset",     name: "Sunset",          slot: "background", cost: 300,  variant: "sunset",    description: "Warm gradient vibes.",      rarity: "rare" },
  { id: "bg-aurora",     name: "Aurora",          slot: "background", cost: 500,  variant: "aurora",    description: "Northern lights energy.",   rarity: "epic" },
  { id: "bg-beach",      name: "Beach",           slot: "background", cost: 400,  variant: "beach",     description: "Vacation mode.",            rarity: "rare" },
  { id: "bg-cyber",      name: "Neon City",       slot: "background", cost: 700,  variant: "cyber",     description: "Cyberpunk nights.",         rarity: "epic", theme: "scifi" },
  { id: "bg-forest",     name: "Forest",          slot: "background", cost: 450,  variant: "forest",    description: "Among the trees.",          rarity: "rare" },
  { id: "bg-classroom",  name: "Classroom",       slot: "background", cost: 350,  variant: "classroom", description: "Library study vibes.",      rarity: "rare", theme: "school" },
  { id: "bg-stadium",    name: "Stadium",         slot: "background", cost: 550,  variant: "stadium",   description: "Game day energy.",          rarity: "epic", theme: "sport" },
  { id: "bg-mountain",   name: "Mountain",        slot: "background", cost: 600,  variant: "mountain",  description: "On top of the world.",      rarity: "epic" },
  { id: "bg-galaxy",     name: "Deep Galaxy",     slot: "background", cost: 1400, variant: "galaxy",    description: "Pure infinity.",            rarity: "legendary", theme: "scifi" },
];

// ════════════════════════════════════════════════════════════════════════════
// LEAGUE — League of Legends style rank ladder
// 10 tiers, with divisions IV → I for Iron through Diamond.
// Master, Grandmaster, Challenger have no divisions (apex ranks).
// ════════════════════════════════════════════════════════════════════════════

/** Master threshold and above (no divisions). */
const APEX_THRESHOLDS: Record<"master" | "grandmaster" | "challenger", number> = {
  master:       30000,
  grandmaster:  50000,
  challenger:   100000,
};

/** Per-tier ladder for Iron → Diamond. 4 divisions each. */
const DIVISION_LADDER: { tier: LeagueTier; division: LeagueDivision; threshold: number }[] = [
  { tier: "iron",     division: "IV",  threshold: 0      },
  { tier: "iron",     division: "III", threshold: 50     },
  { tier: "iron",     division: "II",  threshold: 100    },
  { tier: "iron",     division: "I",   threshold: 200    },

  { tier: "bronze",   division: "IV",  threshold: 350    },
  { tier: "bronze",   division: "III", threshold: 500    },
  { tier: "bronze",   division: "II",  threshold: 700    },
  { tier: "bronze",   division: "I",   threshold: 900    },

  { tier: "silver",   division: "IV",  threshold: 1200   },
  { tier: "silver",   division: "III", threshold: 1500   },
  { tier: "silver",   division: "II",  threshold: 1800   },
  { tier: "silver",   division: "I",   threshold: 2200   },

  { tier: "gold",     division: "IV",  threshold: 2700   },
  { tier: "gold",     division: "III", threshold: 3200   },
  { tier: "gold",     division: "II",  threshold: 3800   },
  { tier: "gold",     division: "I",   threshold: 4500   },

  { tier: "platinum", division: "IV",  threshold: 5500   },
  { tier: "platinum", division: "III", threshold: 6500   },
  { tier: "platinum", division: "II",  threshold: 7700   },
  { tier: "platinum", division: "I",   threshold: 9000   },

  { tier: "emerald",  division: "IV",  threshold: 10500  },
  { tier: "emerald",  division: "III", threshold: 12000  },
  { tier: "emerald",  division: "II",  threshold: 13700  },
  { tier: "emerald",  division: "I",   threshold: 15500  },

  { tier: "diamond",  division: "IV",  threshold: 17500  },
  { tier: "diamond",  division: "III", threshold: 20000  },
  { tier: "diamond",  division: "II",  threshold: 23000  },
  { tier: "diamond",  division: "I",   threshold: 26500  },

  { tier: "master",      division: null, threshold: APEX_THRESHOLDS.master       },
  { tier: "grandmaster", division: null, threshold: APEX_THRESHOLDS.grandmaster  },
  { tier: "challenger",  division: null, threshold: APEX_THRESHOLDS.challenger   },
];

/** Get the user's full rank (tier + division) from their total points. */
export function getRank(points: number): RankInfo {
  let current = DIVISION_LADDER[0];
  let next: typeof current | null = null;
  for (let i = 0; i < DIVISION_LADDER.length; i++) {
    if (points >= DIVISION_LADDER[i].threshold) {
      current = DIVISION_LADDER[i];
      next = DIVISION_LADDER[i + 1] ?? null;
    } else {
      break;
    }
  }
  return {
    tier: current.tier,
    division: current.division,
    threshold: current.threshold,
    nextThreshold: next ? next.threshold : null,
  };
}

/** Threshold for the start of each tier (used in compact summaries). */
export const TIER_THRESHOLDS: Record<LeagueTier, number> = {
  iron:        0,
  bronze:      350,
  silver:      1200,
  gold:        2700,
  platinum:    5500,
  emerald:     10500,
  diamond:     17500,
  master:      APEX_THRESHOLDS.master,
  grandmaster: APEX_THRESHOLDS.grandmaster,
  challenger:  APEX_THRESHOLDS.challenger,
};

export interface TierConfigItem {
  label: string;
  icon: string;       // emoji
  color: string;      // hex
  gradient: [string, string]; // [from, to] for cards
  next?: LeagueTier;
  hasDivisions: boolean;
}

export const TIER_CONFIG: Record<LeagueTier, TierConfigItem> = {
  iron:        { label: "Iron",        icon: "⚙️",  color: "#5C5C5C", gradient: ["#5C5C5C", "#2A2A2A"], next: "bronze",      hasDivisions: true  },
  bronze:      { label: "Bronze",      icon: "🥉",  color: "#CD7F32", gradient: ["#CD7F32", "#8B4513"], next: "silver",      hasDivisions: true  },
  silver:      { label: "Silver",      icon: "🥈",  color: "#C0C0C0", gradient: ["#E5E7EB", "#9CA3AF"], next: "gold",        hasDivisions: true  },
  gold:        { label: "Gold",        icon: "🥇",  color: "#FFD700", gradient: ["#FCD34D", "#D97706"], next: "platinum",    hasDivisions: true  },
  platinum:    { label: "Platinum",    icon: "💎",  color: "#5CD7C6", gradient: ["#5EEAD4", "#0D9488"], next: "emerald",     hasDivisions: true  },
  emerald:     { label: "Emerald",     icon: "🟢",  color: "#10B981", gradient: ["#34D399", "#065F46"], next: "diamond",     hasDivisions: true  },
  diamond:     { label: "Diamond",     icon: "💠",  color: "#60A5FA", gradient: ["#93C5FD", "#1D4ED8"], next: "master",      hasDivisions: true  },
  master:      { label: "Master",      icon: "🔮",  color: "#C084FC", gradient: ["#D8B4FE", "#7E22CE"], next: "grandmaster", hasDivisions: false },
  grandmaster: { label: "Grandmaster", icon: "👑",  color: "#EF4444", gradient: ["#FCA5A5", "#991B1B"], next: "challenger",  hasDivisions: false },
  challenger:  { label: "Challenger",  icon: "🏆",  color: "#FBBF24", gradient: ["#FEF3C7", "#F59E0B"],                       hasDivisions: false },
};

export const ALL_TIERS: LeagueTier[] = [
  "iron", "bronze", "silver", "gold", "platinum",
  "emerald", "diamond", "master", "grandmaster", "challenger",
];

/** Format a rank for display: "Gold II", "Master", etc. */
export function formatRank(info: RankInfo): string {
  const label = TIER_CONFIG[info.tier].label;
  return info.division ? `${label} ${info.division}` : label;
}

// ════════════════════════════════════════════════════════════════════════════
// QUIZ DIFFICULTY OVERRIDES
// ════════════════════════════════════════════════════════════════════════════

/** Question IDs explicitly tagged. Anything not here defaults to "medium". */
export const QUESTION_DIFFICULTY: Record<string, QuizDifficulty> = {
  // HARD — calculation-heavy or multi-step reasoning
  "ci-01": "hard",   // Maya vs Liam compounding
  "ci-02": "hard",   // Rule of 72
  "ci-03": "hard",   // APY vs APR
  "ci-04": "hard",   // Jin vs Priya
  "ci-06": "hard",   // Simple vs compound interest math
  "cr-01": "hard",   // Minimum payment math
  "cr-03": "hard",   // Credit utilization calc
  "sv-02": "hard",   // HYSA math
  "in-01": "hard",   // Real return calc
  "tx-04": "hard",   // Paystub deductions

  // EASY — simple definitions / recognition
  "ci-05": "easy",
  "bg-02": "easy",
  "cr-05": "easy",
  "sv-01": "easy",
  "sv-04": "easy",
  "iv-01": "easy",
  "iv-02": "easy",
  "iv-04": "easy",
  "in-02": "easy",
  "tx-01": "easy",
  "is-01": "easy",
  "is-03": "easy",
  "sc-01": "easy",
  "sc-02": "easy",
};

/** Returns the effective difficulty of a question. */
export function getDifficulty(q: QuizQuestion): QuizDifficulty {
  return q.difficulty ?? QUESTION_DIFFICULTY[q.id] ?? "medium";
}

/** All questions with their effective difficulty resolved. */
export function questionsByDifficulty(difficulty: QuizDifficulty): QuizQuestion[] {
  return QUIZ_QUESTIONS.filter(q => getDifficulty(q) === difficulty);
}

// ════════════════════════════════════════════════════════════════════════════
// LP REWARD CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

export const LP_REWARDS = {
  // Learn mode
  DAILY_CHALLENGE: 150,       // hard question, once/day
  PRACTICE_CORRECT: 5,        // each correct practice answer
  PRACTICE_DAILY_CAP: 120,    // max practice LP per day (raised from 50 — bigger question pool)
  // Extra daily challenges (once/day each, kept below DAILY_CHALLENGE headline)
  HL_PER_CORRECT: 12,         // Higher-or-Lower: per correct round (5 rounds -> up to 60)
  GUESS_MAX_PER: 20,          // Guesstimate: per item, scaled by closeness (4 items -> up to 80)
  MYTH_PER_CORRECT: 10,       // Myth-or-Fact: per correct swipe (6 items -> up to 60)
  // Mastery tiers
  MASTERY_SEEN: 5,
  MASTERY_FAMILIAR: 15,
  MASTERY_PROFICIENT: 30,
  MASTERY_MASTERED: 75,
  // Streak Shield
  STREAK_BASE: 10,
  STREAK_PER_DAY: 1,
  STREAK_CAP: 30,
  // Weekly quests
  QUEST_PER_TASK: 200,
  QUEST_ALL_BONUS: 500,
  // Frugal Ribbons
  RIBBON_REWARD: 300,
  // Budget Streak
  BUDGET_DAILY: 15,
  BUDGET_BOSS: 150,
};

// ════════════════════════════════════════════════════════════════════════════
// MASTERY HELPERS (LP #2)
// ════════════════════════════════════════════════════════════════════════════

export const MASTERY_NAMES = ["Untouched", "Seen", "Familiar", "Proficient", "Mastered"] as const;
export const MASTERY_COLORS = ["#6B7280", "#94A3B8", "#60A5FA", "#A855F7", "#FBBF24"] as const;

/** Returns the new mastery level after a correct answer + LP delta to award. */
export function nextMasteryLevel(
  current: { level: number; correct: number; lastCorrectDate: string | null; firstSeenDate: string },
  today: string,
): { newLevel: 0 | 1 | 2 | 3 | 4; lpDelta: number } {
  const daysSinceFirstSeen = Math.floor(
    (new Date(today).getTime() - new Date(current.firstSeenDate).getTime()) / 86400000
  );
  const daysSinceLastCorrect = current.lastCorrectDate
    ? Math.floor((new Date(today).getTime() - new Date(current.lastCorrectDate).getTime()) / 86400000)
    : Infinity;

  // To advance, you need a NEW day of correct answer (no same-day farming)
  if (daysSinceLastCorrect < 1) return { newLevel: current.level as 0 | 1 | 2 | 3 | 4, lpDelta: 0 };

  // Level requirements:
  //  0 → 1 (Seen):      any correct
  //  1 → 2 (Familiar):  2+ correct, gap of 1+ day
  //  2 → 3 (Proficient): 3+ correct, total span 3+ days
  //  3 → 4 (Mastered):  4+ correct, total span 7+ days
  const cor = current.correct + 1;
  if (current.level === 0)                          return { newLevel: 1, lpDelta: LP_REWARDS.MASTERY_SEEN };
  if (current.level === 1 && cor >= 2)              return { newLevel: 2, lpDelta: LP_REWARDS.MASTERY_FAMILIAR };
  if (current.level === 2 && cor >= 3 && daysSinceFirstSeen >= 3) return { newLevel: 3, lpDelta: LP_REWARDS.MASTERY_PROFICIENT };
  if (current.level === 3 && cor >= 4 && daysSinceFirstSeen >= 7) return { newLevel: 4, lpDelta: LP_REWARDS.MASTERY_MASTERED };
  return { newLevel: current.level as 0 | 1 | 2 | 3 | 4, lpDelta: 0 };
}

// ════════════════════════════════════════════════════════════════════════════
// WEEKLY QUEST DEFINITIONS (LP #3)
// One set picked each Monday — gives variety week-to-week.
// ════════════════════════════════════════════════════════════════════════════

export interface QuestTemplate {
  id: string;
  title: string;
  description: string;
  emoji: string;
  type: WeeklyQuest["type"];
  target: number;
}

export const QUEST_TEMPLATES: QuestTemplate[] = [
  // Quiz quests
  { id: "q-correct-5",   title: "Quick Learner",    description: "Answer 5 quiz questions correctly",   emoji: "🎓", type: "quiz", target: 5 },
  { id: "q-correct-15",  title: "Brainiac",         description: "Answer 15 quiz questions correctly",  emoji: "🧠", type: "quiz", target: 15 },
  { id: "q-correct-25",  title: "Quiz Marathon",    description: "Answer 25 quiz questions correctly",  emoji: "📚", type: "quiz", target: 25 },
  // Stock quests
  { id: "s-trade-3",     title: "Active Trader",    description: "Complete 3 stock trades",             emoji: "📊", type: "stock_trade",  target: 3 },
  { id: "s-profit-100",  title: "Profitable Week",  description: "Earn $100+ in stock profits",         emoji: "💸", type: "stock_profit", target: 100 },
  { id: "s-profit-500",  title: "Wall Street",      description: "Earn $500+ in stock profits",         emoji: "📈", type: "stock_profit", target: 500 },
  // Wallet quests
  { id: "w-log-5",       title: "Money Tracker",    description: "Log 5 transactions",                  emoji: "💰", type: "wallet_log", target: 5 },
  { id: "w-log-10",      title: "Budget Buddy",     description: "Log 10 transactions",                 emoji: "📝", type: "wallet_log", target: 10 },
  { id: "w-log-20",      title: "Finance Diary",    description: "Log 20 transactions",                 emoji: "📖", type: "wallet_log", target: 20 },
  // Life sim quests
  { id: "l-years-10",    title: "Decade Lived",     description: "Advance 10 years in Life Simulator",  emoji: "🎮", type: "life_year", target: 10 },
  { id: "l-years-30",    title: "Life Vet",         description: "Advance 30 years in Life Simulator",  emoji: "🏆", type: "life_year", target: 30 },
];

/**
 * Deterministically pick 3 quests for a given week so progress is stable
 * across reloads. Uses the week start date as the seed.
 */
export function pickWeeklyQuests(weekStart: string): WeeklyQuest[] {
  // Simple seeded shuffle from week-start string hash
  let seed = 0;
  for (let i = 0; i < weekStart.length; i++) seed = (seed * 31 + weekStart.charCodeAt(i)) >>> 0;

  const rng = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  // Always pick one from each "family" if possible
  const families: Record<string, QuestTemplate[]> = {
    quiz:   QUEST_TEMPLATES.filter(q => q.type === "quiz"),
    stock:  QUEST_TEMPLATES.filter(q => q.type === "stock_profit" || q.type === "stock_trade"),
    wallet: QUEST_TEMPLATES.filter(q => q.type === "wallet_log"),
    life:   QUEST_TEMPLATES.filter(q => q.type === "life_year"),
  };

  const pickedFamilies = ["quiz", "stock", "wallet"];  // 3 of 4 families
  // 25% chance of swapping wallet for life to add variety
  if (rng() < 0.33) pickedFamilies[2] = "life";

  return pickedFamilies.map(fam => {
    const pool = families[fam];
    const tpl = pool[Math.floor(rng() * pool.length)];
    return {
      id: tpl.id,
      title: tpl.title,
      description: tpl.description,
      emoji: tpl.emoji,
      type: tpl.type,
      target: tpl.target,
      current: 0,
      reward: LP_REWARDS.QUEST_PER_TASK,
      done: false,
    };
  });
}

// ════════════════════════════════════════════════════════════════════════════
// FRUGAL RIBBONS (LP #4)
// ════════════════════════════════════════════════════════════════════════════

export interface RibbonDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  test: (run: {
    investedBefore25: boolean;
    everInDebt: boolean;
    assetClassesUsed: string[];
    hasInsurance: boolean;
    cpfMaxed: boolean;
    finalAge: number;
    finalWealth: number;
  }) => boolean;
}

export const RIBBONS: RibbonDef[] = [
  {
    id: "compound_king",
    name: "Compound King",
    emoji: "👑",
    description: "Started investing before age 25",
    test: run => run.investedBefore25,
  },
  {
    id: "debt_dodger",
    name: "Debt Dodger",
    emoji: "🛡️",
    description: "Never carried credit-card debt",
    test: run => !run.everInDebt,
  },
  {
    id: "diversified",
    name: "Diversified",
    emoji: "📊",
    description: "Used 3+ different asset classes",
    test: run => run.assetClassesUsed.length >= 3,
  },
  {
    id: "insured",
    name: "Insured",
    emoji: "🛡️",
    description: "Bought insurance during your career",
    test: run => run.hasInsurance,
  },
  {
    id: "cpf_maxed",
    name: "CPF Maxed",
    emoji: "🏦",
    description: "Maxed your CPF contributions",
    test: run => run.cpfMaxed,
  },
  {
    id: "millionaire",
    name: "Millionaire",
    emoji: "💎",
    description: "Retired with $1,000,000+ net worth",
    test: run => run.finalWealth >= 1_000_000,
  },
];

// ════════════════════════════════════════════════════════════════════════════
// EXTRA DAILY CHALLENGES — Higher-or-Lower / Guesstimate / Myth-or-Fact
// Each is selected deterministically per calendar day (Wordle-style) so every
// student gets the same set today and reloading doesn't re-randomize.
// ════════════════════════════════════════════════════════════════════════════

export interface HigherLowerPair {
  id: string;
  prompt: string;       // e.g. "Which is more expensive?" — pick the higher `value`
  a: { label: string; value: number; display: string };
  b: { label: string; value: number; display: string };
  explanation: string;
}

export interface GuesstimateItem {
  id: string;
  question: string;
  answer: number;
  prefix?: string;      // shown before the number, e.g. "S$"
  unit?: string;        // shown after, e.g. "%", " yrs"
  min: number;
  max: number;
  step: number;
  explanation: string;
}

export interface MythFactItem {
  id: string;
  statement: string;
  isFact: boolean;
  explanation: string;
}

export const HIGHER_LOWER_PAIRS: HigherLowerPair[] = [
  {
    id: "hl-hdb-condo", prompt: "Which usually costs more?",
    a: { label: "Median 4-room HDB resale flat", value: 650000, display: "~S$650k" },
    b: { label: "Median private condo unit", value: 1500000, display: "~S$1.5m" },
    explanation: "Private condos in Singapore typically cost roughly 2–3x a resale HDB flat — which is why HDB is the affordable first home for most.",
  },
  {
    id: "hl-returns", prompt: "Which has the higher long-run average return?",
    a: { label: "Singapore Savings Bonds", value: 3, display: "~3% / yr" },
    b: { label: "Global stock index fund", value: 8, display: "~8% / yr" },
    explanation: "Stocks have historically returned more than safe bonds over decades — but with bigger ups and downs. Higher return, higher risk.",
  },
  {
    id: "hl-kopi-sbux", prompt: "Which is pricier per cup?",
    a: { label: "Kopi at a hawker centre", value: 1.4, display: "~S$1.40" },
    b: { label: "Starbucks latte", value: 7, display: "~S$7" },
    explanation: "The cafe cup costs ~5x the hawker kopi. Small daily choices like this add up to thousands a year — the 'latte factor'.",
  },
  {
    id: "hl-interest", prompt: "Which interest rate is higher?",
    a: { label: "Credit card debt", value: 26, display: "~26% / yr" },
    b: { label: "Typical car loan", value: 3, display: "~3% / yr" },
    explanation: "Credit card interest is one of the most expensive forms of debt — far higher than most loans. Never carry a balance if you can help it.",
  },
  {
    id: "hl-cpf", prompt: "Which CPF share is larger (under 55)?",
    a: { label: "Employee contribution", value: 20, display: "20%" },
    b: { label: "Employer contribution", value: 17, display: "17%" },
    explanation: "Employees contribute 20% and employers add 17%, for 37% total going into your CPF — a powerful forced-savings system.",
  },
  {
    id: "hl-gst-svc", prompt: "Which percentage is higher?",
    a: { label: "GST in Singapore", value: 9, display: "9%" },
    b: { label: "Restaurant service charge", value: 10, display: "10%" },
    explanation: "Many restaurants add 10% service charge plus 9% GST — that '++' on menus means your bill is ~19% more than the listed price.",
  },
  {
    id: "hl-bbt-gym", prompt: "Which costs more over a year?",
    a: { label: "A S$5 bubble tea every day", value: 1825, display: "~S$1,825" },
    b: { label: "A S$1,200 annual gym plan", value: 1200, display: "S$1,200" },
    explanation: "A daily S$5 treat is ~S$1,825/year — more than a gym membership. Recurring small spends are often bigger than the 'big' purchases you notice.",
  },
  {
    id: "hl-sdic-salary", prompt: "Which figure is larger?",
    a: { label: "SDIC deposit insurance per bank", value: 100000, display: "S$100k" },
    b: { label: "Typical fresh-grad annual pay", value: 48000, display: "~S$48k" },
    explanation: "SDIC protects up to S$100,000 of your deposits per bank — about double a typical fresh-grad's yearly salary.",
  },
  {
    id: "hl-risk", prompt: "Which is riskier (chance of large loss)?",
    a: { label: "A broad-market ETF", value: 2, display: "Lower risk" },
    b: { label: "A single meme crypto coin", value: 9, display: "Higher risk" },
    explanation: "A diversified ETF spreads risk across hundreds of firms; a single speculative coin can go to zero. Diversification is your friend.",
  },
  {
    id: "hl-save-invest", prompt: "Which grows more over 30 years?",
    a: { label: "S$10k in savings at 0.5%", value: 11600, display: "~S$11.6k" },
    b: { label: "S$10k invested at 7%", value: 76000, display: "~S$76k" },
    explanation: "At 0.5% your money barely grows; at 7% it compounds to ~7x. Over decades, the return rate matters enormously.",
  },
  {
    id: "hl-emergency", prompt: "Which is the larger number of months?",
    a: { label: "Recommended emergency fund (upper end)", value: 6, display: "6 months" },
    b: { label: "Recommended emergency fund (lower end)", value: 3, display: "3 months" },
    explanation: "A solid emergency fund covers 3–6 months of essential expenses, so a setback doesn't force you into high-interest debt.",
  },
  {
    id: "hl-inflation", prompt: "Which is higher?",
    a: { label: "A 4% inflation rate", value: 4, display: "4%" },
    b: { label: "A 0.5% savings rate", value: 0.5, display: "0.5%" },
    explanation: "When inflation (4%) outpaces your savings rate (0.5%), your cash quietly loses buying power each year.",
  },
  {
    id: "hl-bto-resale", prompt: "Which usually costs more?",
    a: { label: "A new BTO 4-room flat", value: 380000, display: "~S$380k" },
    b: { label: "A resale 4-room flat", value: 650000, display: "~S$650k" },
    explanation: "BTO flats are sold by HDB at subsidised prices, so they're usually well below comparable resale flats on the open market.",
  },
  {
    id: "hl-poly-uni", prompt: "Which has higher annual tuition?",
    a: { label: "Polytechnic (subsidised)", value: 3000, display: "~S$3k" },
    b: { label: "Local university (subsidised)", value: 8500, display: "~S$8.5k" },
    explanation: "Even with government subsidies, a local university year costs noticeably more than a polytechnic year.",
  },
  {
    id: "hl-cpf-sa-oa", prompt: "Which CPF account pays more interest?",
    a: { label: "Special Account (SA)", value: 4, display: "~4% / yr" },
    b: { label: "Ordinary Account (OA)", value: 2.5, display: "~2.5% / yr" },
    explanation: "The SA earns a higher floor rate (~4%) than the OA (~2.5%), which is why some people transfer OA to SA for retirement — though it then can't be used for housing.",
  },
  {
    id: "hl-fd-oa", prompt: "Which rate has recently been higher?",
    a: { label: "A good bank fixed deposit", value: 3.5, display: "~3.5% / yr" },
    b: { label: "CPF Ordinary Account", value: 2.5, display: "~2.5% / yr" },
    explanation: "In higher-interest periods, promotional fixed deposits have beaten the CPF OA floor of 2.5% — but FDs lock your cash for a set term.",
  },
  {
    id: "hl-iphone-transit", prompt: "Which costs more?",
    a: { label: "A new iPhone Pro", value: 1800, display: "~S$1,800" },
    b: { label: "A year of student bus + MRT", value: 600, display: "~S$600" },
    explanation: "One flagship phone can cost roughly three years of subsidised student transport — a useful reframing before an upgrade.",
  },
  {
    id: "hl-hawker-foodcourt", prompt: "Which is pricier per plate?",
    a: { label: "Chicken rice at a hawker centre", value: 4, display: "~S$4" },
    b: { label: "Chicken rice at a mall food court", value: 6.5, display: "~S$6.50" },
    explanation: "The same dish often costs 50%+ more in an air-conditioned food court due to higher rent — small location choices add up.",
  },
  {
    id: "hl-wedding-car", prompt: "Which typically costs more in SG?",
    a: { label: "An average wedding banquet", value: 45000, display: "~S$45k" },
    b: { label: "A new mass-market car (incl. COE)", value: 130000, display: "~S$130k" },
    explanation: "Singapore's COE makes car ownership extremely expensive — often more than a big wedding. Factor the total cost of ownership before buying.",
  },
  {
    id: "hl-netflix-gym", prompt: "Which costs more per month?",
    a: { label: "Netflix Standard", value: 17, display: "~S$17" },
    b: { label: "A typical gym membership", value: 90, display: "~S$90" },
    explanation: "Subscriptions stack up: a gym plan can cost 5× a streaming plan. Audit recurring charges — they're easy to forget.",
  },
  {
    id: "hl-save-vs-stocks-20", prompt: "Which grows more over 20 years?",
    a: { label: "S$5k at 2.5% (CPF OA)", value: 8200, display: "~S$8.2k" },
    b: { label: "S$5k at 7% (stock index)", value: 19300, display: "~S$19.3k" },
    explanation: "At 2.5% the money grows modestly; at 7% it compounds to over 3.8×. A higher long-run rate makes a dramatic difference — with more ups and downs along the way.",
  },
];

export const GUESSTIMATE_ITEMS: GuesstimateItem[] = [
  {
    id: "gs-cpf", question: "Total CPF contribution rate for an under-55 employee (employee + employer)?",
    answer: 37, unit: "%", min: 0, max: 60, step: 1,
    explanation: "20% (employee) + 17% (employer) = 37% of your salary saved into CPF.",
  },
  {
    id: "gs-gst", question: "What is Singapore's current GST rate?",
    answer: 9, unit: "%", min: 0, max: 20, step: 1,
    explanation: "GST is 9% as of 2024 — a consumption tax added to most purchases.",
  },
  {
    id: "gs-rule72", question: "Using the Rule of 72, how many years to double your money at 6% per year?",
    answer: 12, unit: " yrs", min: 1, max: 40, step: 1,
    explanation: "72 ÷ 6 = 12 years. The Rule of 72 is a quick doubling-time estimate.",
  },
  {
    id: "gs-emergency", question: "Minimum months of expenses a starter emergency fund should cover?",
    answer: 3, unit: " months", min: 0, max: 12, step: 1,
    explanation: "Aim for at least 3 months (ideally 3–6) of essential expenses set aside.",
  },
  {
    id: "gs-hdb", question: "Median resale price of a 4-room HDB flat (in S$ thousands)?",
    answer: 650, prefix: "S$", unit: "k", min: 200, max: 1200, step: 10,
    explanation: "Around S$650k in recent years — varies by town and lease remaining.",
  },
  {
    id: "gs-index", question: "Long-run average yearly return of a diversified global stock index?",
    answer: 8, unit: "%", min: 0, max: 20, step: 1,
    explanation: "Historically ~7–8% per year before inflation, over multi-decade periods.",
  },
  {
    id: "gs-cc", question: "Typical credit card interest rate in Singapore (per year)?",
    answer: 26, unit: "%", min: 0, max: 40, step: 1,
    explanation: "Around 26% p.a. — extremely expensive. This is why you clear the full balance monthly.",
  },
  {
    id: "gs-cpflife", question: "Age Singaporeans can start CPF LIFE monthly payouts?",
    answer: 65, unit: " yrs", min: 55, max: 75, step: 1,
    explanation: "CPF LIFE payouts can begin at 65, giving income for life in retirement.",
  },
  {
    id: "gs-rule72-4", question: "Rule of 72: how many years to double your money at 4% a year?",
    answer: 18, unit: " yrs", min: 1, max: 40, step: 1,
    explanation: "72 ÷ 4 = 18 years. Lower returns mean much longer doubling times.",
  },
  {
    id: "gs-saverate", question: "A common rule of thumb: what % of your income should you aim to save?",
    answer: 20, unit: "%", min: 0, max: 50, step: 1,
    explanation: "The 50/30/20 rule suggests saving about 20% of income — automate it before you spend the rest.",
  },
  {
    id: "gs-cpf-oa", question: "What interest rate does the CPF Ordinary Account earn?",
    answer: 2.5, unit: "%", min: 0, max: 10, step: 0.5,
    explanation: "The OA earns a floor of about 2.5% per year — low-risk and government-guaranteed.",
  },
  {
    id: "gs-cpf-sa", question: "What floor interest rate does the CPF Special Account earn?",
    answer: 4, unit: "%", min: 0, max: 10, step: 0.5,
    explanation: "The SA earns about 4% — higher than the OA, which is why it's powerful for long-term retirement growth.",
  },
  {
    id: "gs-lifeexp", question: "Average life expectancy in Singapore today (years)?",
    answer: 83, unit: " yrs", min: 60, max: 100, step: 1,
    explanation: "Around 83 years — among the world's highest. Longer lives mean retirement savings must last longer.",
  },
  {
    id: "gs-sp500", question: "Roughly how many companies are in a broad S&P 500 index fund?",
    answer: 500, unit: "", min: 10, max: 1000, step: 10,
    explanation: "About 500 — buying one such fund instantly spreads your money across 500 large US companies.",
  },
  {
    id: "gs-uni-fee", question: "Annual subsidised tuition at a local university (S$ thousands)?",
    answer: 8, prefix: "S$", unit: "k", min: 0, max: 30, step: 1,
    explanation: "Roughly S$8k a year for subsidised local undergraduates — varies by course and intake.",
  },
];

export const MYTH_FACT_ITEMS: MythFactItem[] = [
  { id: "mf-rich", statement: "You need to be rich before you can start investing.", isFact: false,
    explanation: "Myth. With low-cost ETFs and regular small amounts, you can start investing with very little — time in the market matters more than amount." },
  { id: "mf-min", statement: "Paying only the minimum on a credit card is a cheap way to borrow.", isFact: false,
    explanation: "Myth. Minimum payments let ~26% interest snowball — it's one of the most expensive ways to borrow." },
  { id: "mf-etf", statement: "An ETF lets you own a slice of many companies at once.", isFact: true,
    explanation: "Fact. One ETF holds a basket of assets, giving instant diversification, often cheaply." },
  { id: "mf-cpf", statement: "CPF contributions are optional for employees.", isFact: false,
    explanation: "Myth. CPF is mandatory for employees — it's automatically deducted and matched by employers." },
  { id: "mf-inflation", statement: "Inflation can make your cash lose buying power over time.", isFact: true,
    explanation: "Fact. If prices rise faster than your interest, each dollar buys less later." },
  { id: "mf-limit", statement: "A higher credit card limit means you should spend more.", isFact: false,
    explanation: "Myth. A limit is a ceiling, not a target. Spend based on your budget, not your limit." },
  { id: "mf-diversify", statement: "Diversifying reduces the risk that one bad investment ruins you.", isFact: true,
    explanation: "Fact. Spreading money across many assets means no single failure wipes you out." },
  { id: "mf-otp", statement: "Real banks sometimes ask you to read out your full OTP to verify you.", isFact: false,
    explanation: "Myth. No legitimate bank or official will ever ask for your OTP. Never share it." },
  { id: "mf-early", statement: "Starting to invest at 18 instead of 28 can roughly double your retirement pot.", isFact: true,
    explanation: "Fact. Ten extra years of compounding can roughly double the final amount — start early." },
  { id: "mf-bnpl", statement: "Buy-Now-Pay-Later is free money with no downside.", isFact: false,
    explanation: "Myth. BNPL is real debt that makes overspending easy and charges fees if you miss payments." },
  { id: "mf-term", statement: "Term insurance is usually cheaper than whole-life insurance.", isFact: true,
    explanation: "Fact. Term covers a set period for a low premium; whole-life costs much more as it lasts for life and bundles savings." },
  { id: "mf-gst", statement: "GST is a tax on the income you earn.", isFact: false,
    explanation: "Myth. GST is a consumption tax charged when you buy goods and services, not on income." },
  { id: "mf-fund", statement: "An emergency fund should cover about 3–6 months of expenses.", isFact: true,
    explanation: "Fact. That buffer keeps a job loss or big bill from forcing you into high-interest debt." },
  { id: "mf-rent", statement: "Renting a home is always just throwing money away.", isFact: false,
    explanation: "Myth. Renting buys flexibility and avoids maintenance, interest and big upfront costs. Whether buying wins depends on time horizon, prices and rates." },
  { id: "mf-past", statement: "Past stock performance guarantees future returns.", isFact: false,
    explanation: "Myth. Every disclaimer says it for a reason — history informs but never guarantees what markets do next." },
  { id: "mf-highdebt", statement: "It usually makes sense to clear high-interest debt before investing.", isFact: true,
    explanation: "Fact. Paying off a 24% card is a guaranteed 24% 'return' — hard for most investments to beat." },
  { id: "mf-creditscore-age", statement: "Your credit history only starts to matter when you're much older.", isFact: false,
    explanation: "Myth. It builds from your first credit product and affects future loans, cards and even some rentals — habits now matter later." },
  { id: "mf-paynow", statement: "PayNow transfers between banks in Singapore are free.", isFact: true,
    explanation: "Fact. PayNow lets you send money instantly between local banks at no cost — handy for splitting bills." },
  { id: "mf-index", statement: "Low-cost index funds beat most actively managed funds over the long run.", isFact: true,
    explanation: "Fact. After fees, the majority of active funds underperform a simple broad index over long periods." },
  { id: "mf-loseover", statement: "Buying a normal stock with your own cash can lose you MORE than you put in.", isFact: false,
    explanation: "Myth. A normal share can at worst go to zero — you lose what you invested, not more. Losing more requires leverage or short-selling." },
  { id: "mf-insurance", statement: "Insurance is essentially a way to transfer financial risk to an insurer.", isFact: true,
    explanation: "Fact. You pay a premium so the insurer covers a big, unlikely loss — trading a small certain cost for protection." },
  { id: "mf-checkscore", statement: "Checking your own credit score lowers it.", isFact: false,
    explanation: "Myth. Checking your own score is a 'soft' inquiry and doesn't affect it. Only some lender 'hard' checks have a small, temporary effect." },
  { id: "mf-compounddebt", statement: "Compound interest can work against you when you carry debt.", isFact: true,
    explanation: "Fact. The same maths that grows savings also grows unpaid debt — interest charged on interest is how balances snowball." },
];

// ─── Deterministic daily selection (seeded by date string) ──────────────────
function seedFromString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

/** Seeded Fisher-Yates sample — same date+salt always yields the same subset. */
function seededSample<T>(arr: T[], seed: number, n: number): T[] {
  const a = arr.slice();
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  const rng = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(n, a.length));
}

export function pickDailyHigherLower(date: string, n = 5): HigherLowerPair[] {
  return seededSample(HIGHER_LOWER_PAIRS, seedFromString(date + "#hl"), n);
}
export function pickDailyGuesstimate(date: string, n = 4): GuesstimateItem[] {
  return seededSample(GUESSTIMATE_ITEMS, seedFromString(date + "#gs"), n);
}
export function pickDailyMythFact(date: string, n = 6): MythFactItem[] {
  return seededSample(MYTH_FACT_ITEMS, seedFromString(date + "#mf"), n);
}
