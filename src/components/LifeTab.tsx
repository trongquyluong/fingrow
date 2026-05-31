import { useState, useEffect, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Brain, Smile, DollarSign, ChevronRight, RotateCcw, TrendingUp, Calculator } from "lucide-react";
import confetti from "canvas-confetti";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatDeltas {
  money: number;
  happiness: number;
  health: number;
  intelligence: number;
}

interface LifeState {
  name: string;
  age: number;
  money: number;
  happiness: number;
  health: number;
  intelligence: number;
  salary: number;
  investments: number;
  gameOver: boolean;
  gameWon: boolean;
  log: string[];
  scenarioIndex: number;
}

interface Choice {
  text: string;
  money?: number;
  happiness?: number;
  health?: number;
  intelligence?: number;
  investments?: number;
  salary?: number;
  result: string;
}

interface Scenario {
  id: string;
  minAge: number;
  maxAge: number;
  title: string;
  description: string;
  emoji: string;
  choices: Choice[];
}

interface TaxMinigame {
  gross: number;
  federalRate: number;
  stateRate: number;
  ssRate: number;
  medicareRate: number;
}

interface InvestMinigame {
  amount: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STAT_MIN = 20;
const WIN_AGE = 65;
const WIN_SAVINGS = 200_000;
const STORAGE_KEY = "fingrow_life_v1";

const SCENARIOS: Scenario[] = [
  // Ages 8-12
  {
    id: "birthday_money", minAge: 8, maxAge: 12,
    emoji: "🎂", title: "Birthday Money!",
    description: "You received $50 for your birthday. What will you do with it?",
    choices: [
      { text: "Spend it all on toys & games 🎮", money: -50, happiness: 15, result: "Super fun! But the money's gone." },
      { text: "Save every dollar 🏦", happiness: -5, intelligence: 8, result: "Great discipline. Your savings: +$50." },
      { text: "Save $30, spend $20 ⚖️", money: -20, happiness: 8, intelligence: 5, result: "Nice balance! Saved $30, had fun with $20." },
    ],
  },
  {
    id: "school_canteen", minAge: 8, maxAge: 14,
    emoji: "🍕", title: "Lunch Money Dilemma",
    description: "You have $10 for lunch. The canteen pizza costs $8 but you packed a sandwich. Friends are all buying pizza.",
    choices: [
      { text: "Buy the pizza with friends 🍕", money: -8, happiness: 12, result: "Delicious and social! Spent $8." },
      { text: "Eat your sandwich, save the $10 🥪", happiness: -5, health: 5, result: "Healthy and thrifty. Saved all $10!" },
      { text: "Buy a snack ($3) and eat sandwich 🧃", money: -3, happiness: 5, health: 3, result: "Best of both worlds. Saved $7." },
    ],
  },
  {
    id: "video_game", minAge: 10, maxAge: 16,
    emoji: "🎮", title: "New Video Game",
    description: "A new game you've wanted costs $60. You've saved $80. Your friends say it's amazing.",
    choices: [
      { text: "Buy it immediately 💸", money: -60, happiness: 20, result: "Amazing game! Down to $20 savings though." },
      { text: "Wait for a sale 📅", happiness: -5, intelligence: 8, result: "Smart! You'll buy it at 50% off next month." },
      { text: "Skip it, learn to code instead 💻", happiness: -8, intelligence: 15, result: "You used the time to learn coding basics!" },
    ],
  },
  {
    id: "lemonade_stand", minAge: 10, maxAge: 14,
    emoji: "🍋", title: "Lemonade Stand",
    description: "Summer break! You could start a lemonade stand. Costs $15 to set up, potential to earn $40.",
    choices: [
      { text: "Start the stand 🚀", money: 25, happiness: 10, intelligence: 10, result: "Profit! Earned $40, spent $15. Net: +$25." },
      { text: "Too risky, just relax 😎", happiness: 15, health: 5, result: "Relaxing summer! Recharged fully." },
      { text: "Co-invest with a friend 🤝", money: 12, happiness: 12, intelligence: 8, result: "Shared risk — and profits. Each made $12.50." },
    ],
  },
  // Ages 13-17
  {
    id: "part_time_job", minAge: 15, maxAge: 18,
    emoji: "💼", title: "Part-Time Job Offer",
    description: "A local café offers you a weekend job at $12/hr, 8hrs/week. But it means less time for friends.",
    choices: [
      { text: "Take the job! 💪", money: 384, happiness: -10, intelligence: 5, salary: 96, result: "Earned $384/month! Less free time but building work ethic." },
      { text: "Decline — enjoy being a teen 🏖️", happiness: 15, health: 8, result: "Savored youth. Friendships and health boosted." },
      { text: "Negotiate to 4hrs/week 🤝", money: 192, happiness: -3, salary: 48, result: "Compromise! $192/month and still have weekends free." },
    ],
  },
  {
    id: "peer_pressure_spending", minAge: 13, maxAge: 17,
    emoji: "👟", title: "The Cool Sneakers",
    description: "Your friends are all buying $150 limited-edition sneakers. You have $200 saved. Major FOMO.",
    choices: [
      { text: "Buy them to fit in 👟", money: -150, happiness: 12, result: "You fit in! But only $50 left in savings." },
      { text: "Stay strong — savings matter 💪", happiness: -8, intelligence: 10, result: "Held your ground. Your $200 stays safe." },
      { text: "Buy a similar pair for $40 🛒", money: -40, happiness: 6, result: "Good compromise! Kept $160 and still look fresh." },
    ],
  },
  {
    id: "study_or_play", minAge: 13, maxAge: 17,
    emoji: "📚", title: "Exam Week",
    description: "Finals are coming. Your friends are going out Friday night. You have two tests Monday.",
    choices: [
      { text: "Study all weekend 📖", intelligence: 18, happiness: -10, result: "Aced both tests! Intelligence soared." },
      { text: "Go out, cram Sunday night 🎉", intelligence: 5, happiness: 15, health: -5, result: "Fun night, but cramming was rough. Average results." },
      { text: "Study Friday, go out Saturday ⚖️", intelligence: 12, happiness: 8, result: "Perfect balance! Good grades and good times." },
    ],
  },
  // Ages 18-25
  {
    id: "college_decision", minAge: 18, maxAge: 19,
    emoji: "🎓", title: "College or Work?",
    description: "Finished high school. College costs $15,000/year in loans but could mean higher earnings. Or start working now.",
    choices: [
      { text: "Take out loans for college 🎓", money: -15000, intelligence: 25, salary: 500, result: "Invested in your future. Debt now but +$500/month career boost." },
      { text: "Work full-time from now ⚙️", money: 1200, salary: 200, result: "Earning $1,200/month right away. No debt either." },
      { text: "Community college + work part-time 💡", money: -5000, intelligence: 15, salary: 300, result: "Smart compromise! Manageable debt and early experience." },
    ],
  },
  {
    id: "first_apartment", minAge: 20, maxAge: 25,
    emoji: "🏠", title: "First Apartment",
    description: "Time to move out! Option A: $800/mo alone. Option B: $500/mo with roommate. Option C: Stay home, save $1,000/mo.",
    choices: [
      { text: "Solo apartment $800/mo 🏠", money: -800, happiness: 18, health: 5, result: "Independence! But $800/month is steep." },
      { text: "Roommate at $500/mo 🤝", money: -500, happiness: 10, result: "Social and smart. $300/mo cheaper than solo." },
      { text: "Stay home another year 👪", money: 1000, happiness: -8, intelligence: 5, result: "Saved $1,000/month. Not glamorous but very effective." },
    ],
  },
  {
    id: "emergency_fund", minAge: 22, maxAge: 30,
    emoji: "🚨", title: "Unexpected Car Repair",
    description: "Your car needs $800 in repairs. What's your move?",
    choices: [
      { text: "Put it on credit card (20% APR) 💳", money: -960, happiness: -8, result: "Paid $160 in interest on top. Credit cards are expensive." },
      { text: "Use emergency fund savings 💰", money: -800, happiness: -3, intelligence: 8, result: "That's exactly what emergency funds are for!" },
      { text: "Ask family for help 👪", happiness: -12, result: "They covered it interest-free. But it stings to ask." },
    ],
  },
  {
    id: "spending_habits", minAge: 22, maxAge: 35,
    emoji: "☕", title: "The Latte Factor",
    description: "You buy a $6 coffee every workday — $120/month. A friend says you should cut back.",
    choices: [
      { text: "Keep buying coffee ☕", money: -120, happiness: 12, result: "Life's too short! But that's $1,440/year..." },
      { text: "Make coffee at home ($10/mo) 🏠", money: -10, happiness: -5, intelligence: 5, result: "Saved $110/month! $1,320/year invested grows significantly." },
      { text: "Buy 2x/week, brew rest at home 🤝", money: -48, happiness: 6, result: "Saved $72/month — a solid compromise." },
    ],
  },
  // Ages 25-40
  {
    id: "401k_contribution", minAge: 25, maxAge: 40,
    emoji: "📊", title: "401(k) Match",
    description: "Your employer matches 100% of contributions up to 5% of salary. Do you max it out?",
    choices: [
      { text: "Contribute 5% (get full match) 🎯", money: -200, investments: 400, intelligence: 10, result: "Free money! Employer matched $200 → $400 total/month." },
      { text: "Contribute 10% for extra growth 📈", money: -400, investments: 600, happiness: -5, result: "$400 yours + $200 match = $600/month invested." },
      { text: "Skip it — need the cash now 💸", happiness: 5, result: "You left free money on the table. A 100% instant return missed." },
    ],
  },
  {
    id: "lifestyle_creep", minAge: 28, maxAge: 45,
    emoji: "📱", title: "Lifestyle Creep",
    description: "You got a raise! +$400/month. Your current lifestyle is already comfortable.",
    choices: [
      { text: "Upgrade lifestyle immediately 🛍️", money: -400, happiness: 18, result: "Bigger apartment and nicer car! But no savings increase." },
      { text: "Save/invest the full raise 📈", investments: 400, intelligence: 8, happiness: -5, result: "Entire raise goes to wealth-building. Future-you will be grateful." },
      { text: "Split: $200 lifestyle, $200 savings ⚖️", money: -200, investments: 200, happiness: 10, result: "Smart balance! Enjoy now AND build wealth." },
    ],
  },
  {
    id: "side_hustle", minAge: 25, maxAge: 45,
    emoji: "🖥️", title: "Side Hustle Opportunity",
    description: "You can freelance nights/weekends for $500-800/month extra. Costs 10hrs/week.",
    choices: [
      { text: "Go all in on side hustle 🚀", money: 650, happiness: -12, health: -8, result: "Great income! But burnout risk is real. +$650/mo avg." },
      { text: "Keep work-life balance 🧘", happiness: 15, health: 12, result: "Your health and happiness thrive. Balance is underrated." },
      { text: "Do it for 6 months, save earnings 🎯", money: 3900, intelligence: 10, health: -5, result: "Time-boxed hustle! Banked $3,900 then stopped before burning out." },
    ],
  },
  {
    id: "house_decision", minAge: 28, maxAge: 40,
    emoji: "🏡", title: "Rent vs Buy",
    description: "You can buy a $300k home (20% down = $60k, mortgage $1,400/mo) or rent for $1,100/month.",
    choices: [
      { text: "Buy the house 🏡", money: -60000, happiness: 15, intelligence: 10, result: "Big purchase! Down payment was steep but you're building equity." },
      { text: "Keep renting, invest the $60k 📈", investments: 60000, happiness: 8, result: "Invested the down payment. More flexibility and potential gains." },
      { text: "Wait 2 years, save more 📅", money: 12000, intelligence: 8, result: "Saved $1,000/mo for 2 years. Better positioned to buy later." },
    ],
  },
  // Ages 38-55
  {
    id: "insurance_decision", minAge: 38, maxAge: 55,
    emoji: "🏥", title: "Health Insurance Upgrade",
    description: "Basic plan is $200/month. Premium plan is $450/month but covers 90% of costs. You're generally healthy.",
    choices: [
      { text: "Upgrade to premium plan 🏥", money: -450, health: 15, result: "Peace of mind! When you needed it, coverage paid for itself." },
      { text: "Keep basic plan, invest difference 💰", money: -200, investments: 250, result: "Saved $250/month. Calculated risk — hopefully you stay healthy!" },
      { text: "HSA + high-deductible plan 💡", money: -180, investments: 120, intelligence: 10, result: "Smart! HSA is triple tax-advantaged. Invested the difference too." },
    ],
  },
  {
    id: "market_crash", minAge: 35, maxAge: 60,
    emoji: "📉", title: "Stock Market Crash!",
    description: "The market drops 30%. Your portfolio is down. Everyone is panicking.",
    choices: [
      { text: "Sell everything to stop losses 😱", investments: -20000, happiness: -15, result: "You locked in losses. Markets recovered 18 months later — you missed it." },
      { text: "Hold steady — stay the course 💪", intelligence: 15, result: "Turbulent but you held. Two years later your portfolio fully recovered." },
      { text: "Buy more — stocks are 'on sale' 📈", investments: 5000, intelligence: 18, result: "Bold! You bought the dip. Returns over 5 years were exceptional." },
    ],
  },
  {
    id: "kids_college_fund", minAge: 32, maxAge: 48,
    emoji: "👶", title: "529 College Fund",
    description: "You have a child. Start a 529 college savings plan now vs. waiting.",
    choices: [
      { text: "Start 529 now, $200/month 🎓", investments: 200, happiness: 12, intelligence: 10, result: "Compound interest working for 18 years. Best time to start was yesterday!" },
      { text: "Wait until we can afford more 📅", happiness: 5, result: "Delayed start means less compound growth. But you'll get there." },
      { text: "Max out retirement first, then start 529 ⚖️", investments: 400, happiness: 8, intelligence: 8, result: "Prioritized retirement — you can't borrow for retirement but can for college." },
    ],
  },
  // Ages 50-64 — Retirement prep
  {
    id: "retirement_account_max", minAge: 50, maxAge: 64,
    emoji: "🌅", title: "Catch-Up Contributions",
    description: "Over 50? You can contribute an extra $7,500/year to your 401k. It means tighter monthly budgets.",
    choices: [
      { text: "Max out catch-up contributions 🚀", money: -625, investments: 625, intelligence: 12, result: "Full catch-up! $7,500 more per year in your retirement nest egg." },
      { text: "Contribute a little extra ($200/mo) 📈", money: -200, investments: 200, result: "Better than nothing! Extra $2,400/year helps compound." },
      { text: "Maintain current contributions 🤷", result: "Staying the course. Might be enough, might not." },
    ],
  },
  {
    id: "pre_retirement_splurge", minAge: 55, maxAge: 64,
    emoji: "🏖️", title: "One Last Splurge?",
    description: "A dream vacation costs $8,000. Retirement is 10 years away. You have $180k saved.",
    choices: [
      { text: "Book the vacation! YOLO 🏖️", money: -8000, happiness: 25, result: "Life-changing experience! Memories over money." },
      { text: "Skip it — protect the nest egg 🥚", intelligence: 8, happiness: -10, result: "Disciplined. That $8k compounded at 7% over 10 years = ~$15k." },
      { text: "Local vacation for $2,000 🗺️", money: -2000, happiness: 15, result: "Smart! Great experiences without blowing the retirement fund." },
    ],
  },
  // ─── ELDERLY SCENARIOS (58-70) ────────────────────────────────────────────
  {
    id: "retirement_village", minAge: 58, maxAge: 70,
    emoji: "🏘️", title: "Retirement Village",
    description: "A retirement village community is offering a lease for $150k. It includes amenities, social events, and healthcare access. Or stay in your current home.",
    choices: [
      { text: "Buy into the retirement village 🏘️", money: -150000, happiness: 20, health: 15, result: "Wonderful decision! Community, care, and social connection. Health boosted significantly." },
      { text: "Stay home, hire part-time carer ($800/mo) 🏠", money: -800, happiness: 8, health: 8, result: "Comfortable at home with some support. Balanced approach." },
      { text: "Move in with family 👨‍👩‍👧", happiness: 12, health: 5, result: "Family warmth! Minimal cost and lots of connection." },
    ],
  },
  {
    id: "senior_healthcare_plan", minAge: 60, maxAge: 70,
    emoji: "💊", title: "Senior Health Plan",
    description: "A comprehensive senior health plan costs $380/month but covers dental, vision, prescriptions, and physio. Basic Medicare is free.",
    choices: [
      { text: "Upgrade to comprehensive senior plan 💊", money: -380, health: 20, result: "Full coverage! Your health and peace of mind are worth it." },
      { text: "Stick with free Medicare 🃏", money: 0, health: -5, result: "Savings kept, but some out-of-pocket costs will arise." },
      { text: "Add dental + vision only ($150/mo) 🦷👓", money: -150, health: 10, result: "Smart targeted coverage. Covers the most common senior expenses." },
    ],
  },
  {
    id: "social_security_timing", minAge: 62, maxAge: 67,
    emoji: "📋", title: "Social Security Timing",
    description: "You can claim Social Security now at 62 ($1,200/mo reduced) or wait until 67 for full benefits ($1,800/mo).",
    choices: [
      { text: "Claim early at 62 ($1,200/mo) 🏃", money: 1200, salary: 1200, happiness: 10, result: "Extra income now! But permanently reduced by 30% vs. waiting." },
      { text: "Wait for full benefits at 67 ($1,800/mo) ⏳", intelligence: 12, result: "Patient choice! $600/month more for every year of retirement." },
      { text: "Work part-time and delay claiming 🤝", money: 800, salary: 800, health: -5, intelligence: 10, result: "Best of both — part-time income while letting SS grow." },
    ],
  },
  {
    id: "downsizing", minAge: 60, maxAge: 70,
    emoji: "🏠", title: "Downsize Your Home",
    description: "Your home has appreciated to $400k. Kids are grown. Sell and downsize to pocket $200k?",
    choices: [
      { text: "Sell and downsize, pocket $200k 💰", money: 200000, happiness: 8, intelligence: 10, result: "Excellent financial move! $200k freed up for retirement income." },
      { text: "Stay in the family home 🏡", happiness: 15, result: "Emotional value is real. But a large home has maintenance costs." },
      { text: "Rent out a room for $800/mo 🏠", money: 800, salary: 800, happiness: -5, result: "Income without selling! $800/month passive income stream." },
    ],
  },
  {
    id: "senior_part_time", minAge: 60, maxAge: 68,
    emoji: "🛒", title: "Part-Time in Retirement",
    description: "A local library offers you a part-time role 3 days/week for $800/month. Good for purpose and income.",
    choices: [
      { text: "Take the role — stay active 📚", money: 800, salary: 800, happiness: 15, health: 8, intelligence: 8, result: "Amazing! Purpose, social connection, and $800/month. Thriving." },
      { text: "Fully retire — you've earned it 🧘", happiness: 18, health: 5, result: "Well-deserved rest. Enjoying every day of retirement." },
      { text: "Volunteer instead (no pay) 💝", happiness: 20, health: 8, intelligence: 5, result: "Giving back! No income but massive happiness and purpose boost." },
    ],
  },
  {
    id: "grandchildren_college", minAge: 60, maxAge: 70,
    emoji: "🎓", title: "Grandchildren's Education",
    description: "Your grandchildren need help with college. Gift them $10,000 toward tuition?",
    choices: [
      { text: "Gift $10,000 toward tuition 🎓", money: -10000, happiness: 22, result: "Deeply fulfilling. Investing in the next generation." },
      { text: "Contribute $3,000 — what you can afford 💛", money: -3000, happiness: 12, result: "Thoughtful contribution. Every bit helps and you kept your security." },
      { text: "Encourage scholarships instead 📝", intelligence: 5, happiness: 5, result: "Taught them to fish! Helped them find merit-based aid instead." },
    ],
  },
  {
    id: "senior_travel", minAge: 60, maxAge: 70,
    emoji: "✈️", title: "Senior World Tour",
    description: "A 3-week European tour for seniors costs $6,000. Health allows it and friends are going!",
    choices: [
      { text: "Book the trip! Life is short ✈️", money: -6000, happiness: 28, health: 5, result: "Incredible memories! The experiences money can buy at this stage are priceless." },
      { text: "Stay home, save the money 💰", money: 0, happiness: -8, result: "Responsible but you'll wonder 'what if.' Your friends had amazing stories." },
      { text: "Join for 10 days only ($3,000) 🗓️", money: -3000, happiness: 18, health: 3, result: "Best compromise! Saw the highlights without the full cost." },
    ],
  },
  {
    id: "reverse_mortgage", minAge: 63, maxAge: 70,
    emoji: "🏦", title: "Reverse Mortgage",
    description: "A reverse mortgage could give you $1,500/month tax-free from your home equity. But it reduces what you leave as inheritance.",
    choices: [
      { text: "Take the reverse mortgage 💵", money: 1500, salary: 1500, happiness: 10, result: "Extra $1,500/month tax-free! Comfortable retirement secured." },
      { text: "Decline — preserve inheritance 🏡", happiness: 5, result: "Family will benefit. But you'll need to budget carefully." },
      { text: "Sell the home instead 💰", money: 250000, happiness: 8, result: "Clean break! $250k released and no monthly mortgage complexity." },
    ],
  },

  // ═════════════════════════════════════════════════════════════════════
  // V2 EXPANSION — more variants & themes for replayability
  // ═════════════════════════════════════════════════════════════════════

  // ─── Childhood variants (8-12) ───
  {
    id: "chores_money", minAge: 8, maxAge: 11,
    emoji: "🧹", title: "Allowance Negotiation",
    description: "Mom offers $5/week for chores, or $20/month flat. Math time!",
    choices: [
      { text: "$5/week — more total 💰", money: 20, intelligence: 8, result: "$5×4 = $20/month either way, but weekly = 5x in long months!" },
      { text: "$20/month flat 📅", money: 20, happiness: 3, result: "Predictable income! Easier to budget your spending." },
      { text: "Negotiate $25/month 🤝", money: 25, intelligence: 12, happiness: 3, result: "Bold move! Mom agreed since you proved the math." },
    ],
  },
  {
    id: "trading_cards", minAge: 9, maxAge: 13,
    emoji: "🃏", title: "Trading Card Craze",
    description: "Pokemon/sports card packs cost $5 each. A friend offers to trade his rare card for 3 of yours.",
    choices: [
      { text: "Buy 5 packs hoping for rares 🎴", money: -25, happiness: 5, result: "Got mostly commons. Lesson: gacha is gambling in disguise." },
      { text: "Make the trade 🔄", happiness: 8, intelligence: 5, result: "Smart trade! You got value without spending money." },
      { text: "Save and sell yours online 💻", money: 15, intelligence: 10, result: "Set up a small online store! Made $15 profit and learned e-commerce." },
    ],
  },
  {
    id: "school_book_fair", minAge: 8, maxAge: 12,
    emoji: "📚", title: "Book Fair Temptation",
    description: "The school book fair has comics, novels, and educational books. You have $20.",
    choices: [
      { text: "All comics! 📖", money: -20, happiness: 12, result: "Fun reads but won't impress teachers." },
      { text: "Mix of fiction & non-fiction ⚖️", money: -15, happiness: 6, intelligence: 8, result: "Balanced reading! Your vocab and imagination both grew." },
      { text: "Borrow from library, save $20 🏛️", happiness: -3, intelligence: 5, result: "Frugal genius! Same books, $0 cost." },
    ],
  },

  // ─── Teen variants (13-17) ───
  {
    id: "first_phone", minAge: 13, maxAge: 16,
    emoji: "📱", title: "Your First Phone",
    description: "Parents will pay for a basic phone ($150). You want the latest iPhone ($1,200). The gap is your responsibility.",
    choices: [
      { text: "Save up for the iPhone 📱", money: -1050, happiness: 15, result: "Took 9 months but you got it! Felt the cost — strong lesson." },
      { text: "Take the basic phone 📞", happiness: 5, intelligence: 5, result: "It does what a phone does. You skipped $1,050 of vanity tax." },
      { text: "Buy a refurbished iPhone ($600) ♻️", money: -450, happiness: 12, intelligence: 8, result: "Same chip, half price! Smart consumer move." },
    ],
  },
  {
    id: "concert_ticket", minAge: 14, maxAge: 18,
    emoji: "🎤", title: "Once-in-a-Lifetime Concert",
    description: "Your favorite artist is touring nearby. Tickets are $200 (VIP $500). Resellers want $800.",
    choices: [
      { text: "VIP all the way 🎟️", money: -500, happiness: 25, result: "Backstage moment! Pricey memory but unforgettable." },
      { text: "Regular ticket 🎵", money: -200, happiness: 18, result: "Great night! Saved $300 vs VIP." },
      { text: "Skip — watch on YouTube 🎥", happiness: -5, result: "Free, but you missed the energy. Recordings ≠ live experience." },
    ],
  },
  {
    id: "tutoring_gig", minAge: 14, maxAge: 17,
    emoji: "📐", title: "Tutoring Younger Kids",
    description: "Neighbor offers $25/hour to tutor her 10-year-old in math, 2 hrs/week.",
    choices: [
      { text: "Take it! Easy money 💵", money: 200, intelligence: 8, salary: 50, result: "$200/month and you reinforced your own math too!" },
      { text: "Decline — too much commitment 🚫", happiness: 3, result: "More free time, but you skipped easy income + a teaching skill." },
      { text: "Charge $35/hr — premium pricing 💎", money: 280, intelligence: 12, salary: 70, result: "She agreed because you're confident! Lesson: price your value." },
    ],
  },
  {
    id: "ig_influence", minAge: 14, maxAge: 17,
    emoji: "📸", title: "Influencer Dreams",
    description: "Your Insta is growing. A 'mentor' offers to fast-track you to 100k followers for $300.",
    choices: [
      { text: "Pay the mentor 💸", money: -300, happiness: -5, intelligence: -3, result: "Got blocked-and-deleted. Classic scam — there are no shortcuts." },
      { text: "Grow organically 🌱", happiness: 5, intelligence: 8, result: "Slower but real. You learned content strategy for free on YouTube." },
      { text: "Quit Insta, study instead 📚", intelligence: 15, happiness: -5, result: "Bold. Your screen-time dropped, grades shot up." },
    ],
  },
  {
    id: "energy_drinks", minAge: 13, maxAge: 17,
    emoji: "🥤", title: "Energy Drink Habit",
    description: "Friends drink $5 energy drinks daily. You're tempted to keep up.",
    choices: [
      { text: "Daily energy drink — $150/month 🚀", money: -150, happiness: 5, health: -8, result: "Fitted in. Heart rate up, savings down, sleep wrecked." },
      { text: "Water + occasional treat 💧", money: -20, health: 8, intelligence: 3, result: "$130 saved monthly AND healthier. Compound impact." },
      { text: "Make your own coffee at home ☕", money: -30, happiness: 3, intelligence: 5, result: "Cheaper, healthier, and you became the resident barista." },
    ],
  },

  // ─── Young adult variants (18-30) ───
  {
    id: "credit_card_offer", minAge: 18, maxAge: 22,
    emoji: "💳", title: "First Credit Card",
    description: "A bank offers you a card with $2,000 limit. 'Build credit', they say.",
    choices: [
      { text: "Sign up — use & pay in full ✅", intelligence: 12, happiness: 3, result: "Smart adult move. Credit score climbing, no interest paid." },
      { text: "Decline — debit is enough 🛡️", intelligence: 5, result: "No risk, but you missed an easy chance to build credit history." },
      { text: "Sign up, max it out 🛒", money: -2000, happiness: 8, intelligence: -8, result: "Spending spree! 24% APR is now eating your future paychecks." },
    ],
  },
  {
    id: "crypto_friend", minAge: 18, maxAge: 30,
    emoji: "₿", title: "Crypto Bro",
    description: "Your cousin made $50k on a meme coin. He's begging you to YOLO $2,000 into the next one.",
    choices: [
      { text: "YOLO $2,000 in 🚀", money: -2000, happiness: -10, intelligence: -5, result: "It crashed 95% in a week. Brutal lesson on speculation." },
      { text: "Put $100 to learn (risk tolerance) 🧪", money: -100, intelligence: 10, result: "Small bet = no nightmare. You learned crypto firsthand." },
      { text: "Hard pass — index funds for you 📊", money: 100, intelligence: 12, result: "Boring? Maybe. But the $2,000 in an ETF will beat 95% of crypto trades long-term." },
    ],
  },
  {
    id: "wedding_invite", minAge: 22, maxAge: 35,
    emoji: "💍", title: "Wedding Season",
    description: "3 friends are getting married this year. Bridal party costs: $800 each in dresses, flights, and gifts.",
    choices: [
      { text: "Be in all 3 bridal parties 💃", money: -2400, happiness: 18, result: "Amazing memories, but your travel fund is wiped." },
      { text: "Attend as guest only ($150 each) 🎁", money: -450, happiness: 8, result: "Showed up, supported, didn't go broke." },
      { text: "Skip one (be honest about cost) 🙏", money: -1600, happiness: 5, intelligence: 8, result: "Awkward convo but the friend understood. Adulting." },
    ],
  },
  {
    id: "subscription_audit", minAge: 22, maxAge: 35,
    emoji: "📺", title: "Subscription Audit",
    description: "Bank statement shows $112/month in subscriptions: Netflix, Spotify, gym, news, cloud, dating apps...",
    choices: [
      { text: "Cancel everything you don't use weekly ✂️", money: 70, intelligence: 12, happiness: -3, result: "Cut to $42/month. That's $840/year saved!" },
      { text: "Bundle & share with friends 🤝", money: 50, happiness: 5, intelligence: 8, result: "Family plans cut Netflix & Spotify in half." },
      { text: "Keep them all — life's short ⏰", happiness: 3, result: "Convenience tax: $1,344/year on stuff you barely use." },
    ],
  },
  {
    id: "first_car", minAge: 22, maxAge: 30,
    emoji: "🚗", title: "First Car Decision",
    description: "You need a car. New Tesla ($45k loan), reliable used Honda ($12k cash), or stick with public transport.",
    choices: [
      { text: "Lease the Tesla ✨", money: -45000, happiness: 22, intelligence: -5, result: "Cool factor: 10/10. Your savings: $0. Insurance: brutal." },
      { text: "Pay cash for the Honda 🚙", money: -12000, happiness: 10, intelligence: 10, result: "Practical, no debt. The Honda will run 200,000+ miles." },
      { text: "Stay car-free 🚇", happiness: -3, health: 8, intelligence: 8, result: "Walking & transit. You saved a fortune AND got fitter." },
    ],
  },
  {
    id: "boss_promotion", minAge: 25, maxAge: 40,
    emoji: "📈", title: "Promotion Offer",
    description: "Boss offers a promotion: +$15k salary, 50% more hours, frequent travel. Work-life balance? Gone.",
    choices: [
      { text: "Accept — career first 💼", money: 1250, salary: 1250, happiness: -10, health: -5, result: "$15k/year more, but you're tired all the time." },
      { text: "Decline politely 🙏", happiness: 8, health: 3, result: "Kept your balance. Your boss respected it." },
      { text: "Counter: same role, 10% raise 🎯", money: 800, salary: 800, happiness: 3, intelligence: 8, result: "Boss agreed! +10% with no extra hours. Negotiation wins." },
    ],
  },
  {
    id: "stock_dip", minAge: 25, maxAge: 50,
    emoji: "📉", title: "Market Dip Panic",
    description: "Your $20k portfolio just dropped 30% in a month. News says 'recession incoming.'",
    choices: [
      { text: "Panic sell to cash 💸", money: 14000, happiness: -10, intelligence: -10, result: "Locked in -$6k loss. Market recovered fully in 8 months." },
      { text: "Hold & ignore the news 😌", intelligence: 15, happiness: 3, result: "Took guts but recovered in 8 months. Time in market wins." },
      { text: "Buy more at the discount 🛒", money: -5000, intelligence: 18, result: "Bought the dip! 18 months later, +40% gain on the new shares." },
    ],
  },

  // ─── Mid-life variants (30-55) ───
  {
    id: "career_pivot", minAge: 30, maxAge: 45,
    emoji: "🔄", title: "Career Pivot",
    description: "You've worked in marketing for 10 years and hate it. A bootcamp for data science costs $12k. Income gap: 6 months.",
    choices: [
      { text: "Quit & enroll 💻", money: -12000, intelligence: 22, happiness: 15, result: "Reborn! Landed a data role in 8 months, +$30k salary boost." },
      { text: "Self-study while working 📚", intelligence: 15, happiness: 5, result: "Took 2 years but you switched without losing income. Slower but safer." },
      { text: "Stay — it's stable 🪑", happiness: -10, intelligence: -3, result: "Steady paycheck, but Sunday-night dread continues." },
    ],
  },
  {
    id: "wedding_yours", minAge: 26, maxAge: 38,
    emoji: "💒", title: "Your Wedding Budget",
    description: "Engaged! Average wedding cost: $35k. Parents will pitch in $10k.",
    choices: [
      { text: "Dream wedding — $50k ($40k yours) 💎", money: -40000, happiness: 25, result: "Magical day. 2-year savings vaporized." },
      { text: "Intimate ceremony — $8k 🌸", money: -8000, happiness: 18, intelligence: 8, result: "Personal & meaningful. Honeymoon fund: $32k saved." },
      { text: "Elope, party with savings 🌴", money: -5000, happiness: 22, intelligence: 12, result: "Just you two and Bali. Best decision ever." },
    ],
  },
  {
    id: "parent_health", minAge: 35, maxAge: 55,
    emoji: "🏥", title: "Parent's Health Scare",
    description: "Dad needs an unexpected surgery. Insurance covers most, but $8k out-of-pocket remains.",
    choices: [
      { text: "Pay it from savings ❤️", money: -8000, happiness: 12, result: "Right thing to do. Dad recovered, family closer." },
      { text: "Split with siblings (3-way) 🤝", money: -2700, happiness: 8, result: "Fair distribution. Family teamwork." },
      { text: "Set up a GoFundMe 📱", money: 0, happiness: -3, intelligence: 3, result: "Community helped. Not your favorite moment but it worked." },
    ],
  },
  {
    id: "midlife_crisis", minAge: 40, maxAge: 50,
    emoji: "🏍️", title: "Midlife Splurge",
    description: "You're 45. A $25k motorcycle is calling your name.",
    choices: [
      { text: "Buy it — YOLO 🏍️", money: -25000, happiness: 18, health: -5, result: "Cool? Yes. Smart? Debatable. Worth it? Your retirement says no." },
      { text: "Rent one for the weekend ($300) 🛣️", money: -300, happiness: 12, intelligence: 8, result: "Scratched the itch for $300. Genius." },
      { text: "Reinvest in fitness instead 🏋️", money: -1000, health: 15, happiness: 10, result: "PT + gym + bike. You feel 30 again." },
    ],
  },

  // ─── Senior variants (55-65) ───
  {
    id: "estate_plan", minAge: 55, maxAge: 65,
    emoji: "📜", title: "Estate Planning",
    description: "A lawyer offers $800 to draft your will, power of attorney, and trust.",
    choices: [
      { text: "Do it properly with lawyer 📝", money: -800, intelligence: 15, happiness: 8, result: "Peace of mind. Family won't fight over assets." },
      { text: "DIY online for $50 💻", money: -50, intelligence: 5, result: "Better than nothing. May not cover edge cases." },
      { text: "Skip — figure it out later ⏳", happiness: -3, result: "Bad move. 60% of adults die without a will. Family chaos likely." },
    ],
  },
  {
    id: "side_business_late", minAge: 55, maxAge: 65,
    emoji: "🎨", title: "Pursue a Passion Project",
    description: "You always wanted to sell art on Etsy. Startup cost: $500, time: 10 hrs/week.",
    choices: [
      { text: "Launch the shop 🎨", money: -500, happiness: 18, salary: 200, result: "Modest income + huge fulfillment. Wish you'd started earlier." },
      { text: "Stay in your current job 💼", happiness: -5, result: "Comfortable but you'll regret never trying." },
      { text: "Teach a class at the community center 👩‍🏫", money: 0, happiness: 15, salary: 100, result: "Helped others, got paid a bit, made new friends." },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// SURPRISE EVENTS — random one-screen events that fire between scenarios.
// Each has a single "Continue" button with auto-applied stat deltas.
// minAge/maxAge gates them to plausible life stages.
// ═══════════════════════════════════════════════════════════════════════════

interface SurpriseEvent {
  id: string;
  emoji: string;
  title: string;
  description: string;
  minAge: number;
  maxAge: number;
  /** Stat deltas applied automatically. */
  effects: Partial<StatDeltas> & { investments?: number; salary?: number };
  /** 0..1 — relative rarity weight. Lower = rarer. */
  weight: number;
}

const SURPRISE_EVENTS: SurpriseEvent[] = [
  // Positive
  { id: "found_money",    emoji: "💵", title: "Lucky Find!", description: "You found $20 on the sidewalk!", minAge: 8, maxAge: 65, effects: { money: 20, happiness: 5 }, weight: 1.0 },
  { id: "gift_grandma",   emoji: "👵", title: "Grandma's Gift", description: "Grandma sent you $100 in a card!", minAge: 8, maxAge: 30, effects: { money: 100, happiness: 8 }, weight: 0.8 },
  { id: "viral_tiktok",   emoji: "📱", title: "Viral Moment", description: "Your TikTok hit 500k views — TikTok pays you $80.", minAge: 14, maxAge: 25, effects: { money: 80, happiness: 12 }, weight: 0.5 },
  { id: "tax_refund",     emoji: "🧾", title: "Tax Refund!", description: "Surprise — your tax refund came in: $620.", minAge: 22, maxAge: 60, effects: { money: 620, happiness: 5 }, weight: 0.7 },
  { id: "scratch_win",    emoji: "🎰", title: "Scratch Card Win", description: "You spent $5 on a scratchcard and won $250! (Don't make this a habit.)", minAge: 18, maxAge: 60, effects: { money: 245, happiness: 10 }, weight: 0.3 },
  { id: "stock_dividend", emoji: "📊", title: "Surprise Dividend", description: "Your investments paid an unexpected dividend.", minAge: 25, maxAge: 65, effects: { money: 300, intelligence: 3 }, weight: 0.6 },
  { id: "promotion_bonus",emoji: "🎯", title: "Performance Bonus", description: "Boss awarded you a $1,500 bonus for crushing it.", minAge: 25, maxAge: 55, effects: { money: 1500, happiness: 12, salary: 100 }, weight: 0.5 },
  { id: "inheritance",    emoji: "📜", title: "Distant Relative", description: "A great-aunt left you $8,000 in her will.", minAge: 30, maxAge: 60, effects: { money: 8000, happiness: 5 }, weight: 0.2 },
  { id: "viral_meme",     emoji: "🎬", title: "Internet Famous", description: "A photo you took went viral and a brand paid $500 to license it!", minAge: 16, maxAge: 35, effects: { money: 500, happiness: 15 }, weight: 0.4 },
  { id: "free_concert",   emoji: "🎫", title: "Free Tickets!", description: "You won concert tickets from a radio call-in!", minAge: 14, maxAge: 45, effects: { happiness: 18, health: -3 }, weight: 0.4 },
  { id: "raise_inflation",emoji: "📈", title: "Cost-of-Living Raise", description: "HR adjusted everyone's salary +3% for inflation.", minAge: 22, maxAge: 60, effects: { salary: 50, happiness: 5 }, weight: 0.6 },
  { id: "friend_pay_back",emoji: "🙏", title: "Old Debt Repaid", description: "A friend you helped years ago repaid the $300 you forgot about.", minAge: 22, maxAge: 60, effects: { money: 300, happiness: 8 }, weight: 0.5 },

  // Negative
  { id: "phone_drop",     emoji: "📱", title: "Cracked Phone", description: "You dropped your phone. Screen repair: $180.", minAge: 13, maxAge: 60, effects: { money: -180, happiness: -8 }, weight: 1.0 },
  { id: "flu_season",     emoji: "🤧", title: "Caught the Flu", description: "Bedridden for a week. Missed work + meds.", minAge: 8, maxAge: 65, effects: { money: -100, health: -8, happiness: -5 }, weight: 0.9 },
  { id: "car_repair",     emoji: "🔧", title: "Car Trouble", description: "Brakes need replacing. Mechanic charges $750.", minAge: 22, maxAge: 60, effects: { money: -750, happiness: -8 }, weight: 0.7 },
  { id: "phishing",       emoji: "🎣", title: "Phishing Attempt", description: "A scam SMS asked for your bank login. You spotted it!", minAge: 16, maxAge: 65, effects: { intelligence: 5, happiness: 5 }, weight: 0.7 },
  { id: "phishing_fail",  emoji: "😰", title: "Got Scammed", description: "Clicked a phishing link. Bank refunded $500 of the $1,200 stolen.", minAge: 18, maxAge: 65, effects: { money: -700, intelligence: 8, happiness: -10 }, weight: 0.2 },
  { id: "rent_increase",  emoji: "🏠", title: "Rent Hike", description: "Landlord raised rent by $100/month.", minAge: 22, maxAge: 55, effects: { salary: -100, happiness: -5 }, weight: 0.5 },
  { id: "lost_wallet",    emoji: "💳", title: "Lost Wallet", description: "Your wallet's gone. Cash + replacement cards: -$150.", minAge: 14, maxAge: 65, effects: { money: -150, happiness: -8 }, weight: 0.5 },
  { id: "dental_emergency",emoji: "🦷", title: "Root Canal", description: "Surprise dental work. Insurance didn't cover it: $1,200.", minAge: 22, maxAge: 65, effects: { money: -1200, health: -3, happiness: -5 }, weight: 0.4 },
  { id: "speeding_ticket",emoji: "🚓", title: "Speeding Ticket", description: "$220 fine + insurance hike incoming.", minAge: 18, maxAge: 60, effects: { money: -220, happiness: -8 }, weight: 0.5 },
  { id: "pet_vet",        emoji: "🐶", title: "Pet Emergency Vet", description: "Pet needed urgent care. Vet bill: $600.", minAge: 22, maxAge: 60, effects: { money: -600, happiness: 5 }, weight: 0.4 },

  // Neutral / lifestyle
  { id: "gym_membership", emoji: "🏋️", title: "Gym Sign-Up Hype", description: "January motivation: joined a gym at $50/month.", minAge: 16, maxAge: 50, effects: { salary: -50, health: 8 }, weight: 0.4 },
  { id: "new_friend",     emoji: "🤝", title: "Made a New Friend", description: "Met someone awesome through a class!", minAge: 8, maxAge: 60, effects: { happiness: 10 }, weight: 0.7 },
  { id: "learned_skill",  emoji: "💡", title: "Picked Up a Skill", description: "You spent the month learning to cook. Saves food costs!", minAge: 16, maxAge: 60, effects: { intelligence: 8, health: 5, money: 80 }, weight: 0.6 },
  { id: "read_book",      emoji: "📖", title: "Finished a Great Book", description: "You finished 'The Psychology of Money' — eye-opening!", minAge: 14, maxAge: 65, effects: { intelligence: 10, happiness: 5 }, weight: 0.5 },
];

function pickSurprise(age: number): SurpriseEvent | null {
  const pool = SURPRISE_EVENTS.filter(e => age >= e.minAge && age <= e.maxAge);
  if (pool.length === 0) return null;
  const totalWeight = pool.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * totalWeight;
  for (const e of pool) {
    r -= e.weight;
    if (r <= 0) return e;
  }
  return pool[0];
}

// ─── Special minigame ages ────────────────────────────────────────────────────

const TAX_AGE = 23;
const INVEST_AGE = 30;
const BUDGET_AGES = new Set([26, 35, 50]);

function getTaxData(salary: number): TaxMinigame {
  const gross = Math.max(salary * 12, 30000);
  return { gross, federalRate: 0.22, stateRate: 0.05, ssRate: 0.062, medicareRate: 0.0145 };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(val: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, val));
}

function getScenariosForAge(age: number, usedIds: string[]): Scenario[] {
  return SCENARIOS.filter(s => age >= s.minAge && age <= s.maxAge && !usedIds.includes(s.id));
}

function pickScenario(age: number, usedIds: string[]): Scenario | null {
  const pool = getScenariosForAge(age, usedIds);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function getAgeLabel(age: number) {
  if (age <= 12) return { label: "Childhood", emoji: "🧒", color: "text-yellow-500" };
  if (age <= 17) return { label: "Teenager", emoji: "🧑", color: "text-green-500" };
  if (age <= 25) return { label: "Young Adult", emoji: "👨", color: "text-blue-500" };
  if (age <= 40) return { label: "Adult", emoji: "🧑‍💼", color: "text-purple-500" };
  if (age <= 55) return { label: "Mid-Life", emoji: "👔", color: "text-orange-500" };
  return { label: "Senior", emoji: "👴", color: "text-brand-coral" };
}

function formatMoney(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

function deltaLabel(val: number, prefix = "") {
  if (val === 0) return null;
  const sign = val > 0 ? "+" : "";
  return `${prefix}${sign}${val > 1000 || val < -1000 ? formatMoney(val) : val}`;
}

// ─── Stat Bar ─────────────────────────────────────────────────────────────────

function StatBar({
  label, value, color, icon, delta,
}: {
  label: string; value: number; color: string; icon: ReactNode; delta?: number;
}) {
  const pct = clamp(value, 0, 100);
  const dangerZone = value <= 35;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
          {icon}
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {delta !== undefined && delta !== 0 && (
            <motion.span
              key={`${label}-${delta}`}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-[10px] font-black ${delta > 0 ? "text-brand-mint" : "text-brand-coral"}`}
            >
              {delta > 0 ? "+" : ""}{delta}
            </motion.span>
          )}
          <span className={`text-xs font-black ${dangerZone ? "text-brand-coral" : "text-[var(--text-main)]"}`}>
            {value.toFixed(0)}{dangerZone && " ⚠️"}
          </span>
        </div>
      </div>
      <div className="h-2.5 w-full bg-slate-200/60 dark:bg-slate-700/60 rounded-full overflow-hidden">
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

// ─── Tax Minigame ─────────────────────────────────────────────────────────────

function TaxMinigameCard({ data, onComplete }: { data: TaxMinigame; onComplete: (correct: boolean) => void }) {
  const monthly = data.gross / 12;
  const federal = monthly * data.federalRate;
  const state = monthly * data.stateRate;
  const ss = monthly * data.ssRate;
  const medicare = monthly * data.medicareRate;
  const correctNet = monthly - federal - state - ss - medicare;

  const shuffled = useRef(
    [
      Math.round(correctNet),
      Math.round(correctNet * 1.12),
      Math.round(correctNet * 0.85),
      Math.round(monthly * 0.72),
    ].sort(() => Math.random() - 0.5)
  );

  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    setTimeout(() => onComplete(selected === Math.round(correctNet)), 1200);
  };

  return (
    <div className="card-base flex flex-col gap-5 shadow-xl !border-brand-blue/20">
      <div className="flex items-center gap-2">
        <div className="bg-brand-blue/10 p-2 rounded-xl"><Calculator size={20} className="text-brand-blue" /></div>
        <div>
          <h3 className="font-black text-base">Tax Calculator 🧾</h3>
          <p className="text-xs text-[var(--text-muted)]">Age 23 — first real job! Calculate your monthly take-home.</p>
        </div>
      </div>

      <div className="bg-[var(--bg-main)] rounded-2xl p-4 flex flex-col gap-2 text-sm">
        <div className="flex justify-between font-bold">
          <span>Annual Salary</span>
          <span className="text-brand-mint">{formatMoney(data.gross)}</span>
        </div>
        <div className="border-t border-[var(--border-color)] my-1" />
        <div className="flex justify-between text-[var(--text-muted)] text-xs">
          <span>Monthly Gross</span><span>${monthly.toFixed(0)}/mo</span>
        </div>
        <div className="flex justify-between text-brand-coral text-xs">
          <span>Federal Tax ({(data.federalRate * 100).toFixed(0)}%)</span><span>-${federal.toFixed(0)}</span>
        </div>
        <div className="flex justify-between text-brand-coral text-xs">
          <span>State Tax ({(data.stateRate * 100).toFixed(0)}%)</span><span>-${state.toFixed(0)}</span>
        </div>
        <div className="flex justify-between text-orange-500 text-xs">
          <span>Social Security ({(data.ssRate * 100).toFixed(1)}%)</span><span>-${ss.toFixed(0)}</span>
        </div>
        <div className="flex justify-between text-orange-500 text-xs">
          <span>Medicare ({(data.medicareRate * 100).toFixed(2)}%)</span><span>-${medicare.toFixed(0)}</span>
        </div>
        <div className="border-t border-[var(--border-color)] mt-1 pt-2 flex justify-between font-black">
          <span>Monthly Take-Home = ?</span><span className="text-brand-purple">???</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {shuffled.current.map((opt) => {
          const isCorrect = opt === Math.round(correctNet);
          return (
            <button key={opt} disabled={submitted} onClick={() => setSelected(opt)}
              className={`p-3 rounded-2xl border-2 font-black text-sm transition-all ${
                submitted
                  ? isCorrect ? "bg-brand-mint/20 border-brand-mint"
                    : selected === opt ? "bg-brand-coral/20 border-brand-coral"
                    : "opacity-30 border-transparent bg-slate-100 dark:bg-slate-800"
                  : selected === opt ? "bg-brand-purple/10 border-brand-purple text-brand-purple"
                  : "bg-[var(--bg-main)] border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}>
              ${opt.toLocaleString()}/mo
            </button>
          );
        })}
      </div>

      <button onClick={handleSubmit} disabled={selected === null || submitted}
        className={`w-full py-3.5 rounded-2xl font-black transition-all ${
          selected !== null && !submitted
            ? "bg-slate-900 dark:bg-brand-blue text-white"
            : "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600"
        }`}>
        {submitted ? "Checking..." : "Submit Answer"}
      </button>
    </div>
  );
}

// ─── Investment Minigame ──────────────────────────────────────────────────────

const INVEST_OPTIONS = [
  { id: "savings", label: "High-Yield Savings", icon: "🏦", returnRange: "4-5% safe", risk: "Very Low" },
  { id: "index", label: "Index Fund (S&P 500)", icon: "📊", returnRange: "7-10% avg", risk: "Medium" },
  { id: "crypto", label: "Cryptocurrency", icon: "₿", returnRange: "volatile ±50%", risk: "Very High" },
];

function InvestMinigameCard({ data, onComplete }: { data: InvestMinigame; onComplete: (choice: string) => void }) {
  const [allocation, setAllocation] = useState({ savings: 40, index: 40, crypto: 20 });

  const handleSlider = (key: keyof typeof allocation, val: number) => {
    const others = (Object.keys(allocation) as (keyof typeof allocation)[]).filter(k => k !== key);
    const remaining = 100 - val;
    const otherTotal = others.reduce((s, k) => s + allocation[k], 0);
    const newAlloc = { ...allocation, [key]: val };
    if (otherTotal > 0) {
      others.forEach(k => { newAlloc[k] = Math.round((allocation[k] / otherTotal) * remaining); });
    }
    setAllocation(newAlloc);
  };

  const feedback = () => {
    if (allocation.crypto > 50) return { msg: "High risk! Crypto is volatile — could 2x or lose 80%.", color: "text-brand-coral" };
    if (allocation.savings > 80) return { msg: "Too conservative — inflation erodes savings over time.", color: "text-brand-blue" };
    if (allocation.index >= 40 && allocation.crypto <= 20) return { msg: "Well balanced! Index funds are the backbone of wealth building.", color: "text-brand-mint" };
    return { msg: "Decent mix. Consider more index funds for long-term growth.", color: "text-brand-purple" };
  };

  const fb = feedback();
  const dominant = allocation.crypto > 50 ? "crypto" : allocation.savings > 60 ? "savings" : "index";

  return (
    <div className="card-base flex flex-col gap-5 shadow-xl !border-brand-purple/20">
      <div className="flex items-center gap-2">
        <div className="bg-brand-purple/10 p-2 rounded-xl"><TrendingUp size={20} className="text-brand-purple" /></div>
        <div>
          <h3 className="font-black text-base">Investment Allocator 📊</h3>
          <p className="text-xs text-[var(--text-muted)]">Age 30 — you have {formatMoney(data.amount)} to invest. How do you split it?</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {INVEST_OPTIONS.map((opt) => {
          const pct = allocation[opt.id as keyof typeof allocation];
          const dollars = Math.round((pct / 100) * data.amount);
          return (
            <div key={opt.id} className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{opt.icon}</span>
                  <div>
                    <p className="font-bold text-sm">{opt.label}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{opt.returnRange} · {opt.risk} risk</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm">{pct}%</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{formatMoney(dollars)}</p>
                </div>
              </div>
              <input type="range" min={0} max={100} value={pct}
                onChange={(e) => handleSlider(opt.id as keyof typeof allocation, Number(e.target.value))}
                className="w-full accent-brand-purple h-2 rounded-full" />
            </div>
          );
        })}
      </div>

      <div className={`p-3 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] text-sm font-bold ${fb.color}`}>
        💡 {fb.msg}
      </div>

      <button onClick={() => onComplete(dominant)}
        className="w-full py-3.5 rounded-2xl font-black bg-slate-900 dark:bg-brand-purple text-white">
        Confirm Allocation →
      </button>
    </div>
  );
}

// ─── Budget Minigame ──────────────────────────────────────────────────────────

function BudgetMinigameCard({ income, age, onComplete }: { income: number; age: number; onComplete: (saved: number) => void }) {
  const netIncome = income > 0 ? income : 2000;

  const EXPENSES = [
    { id: "rent", label: "Rent/Housing", emoji: "🏠", required: true, suggested: Math.round(netIncome * 0.3), min: Math.round(netIncome * 0.25), max: Math.round(netIncome * 0.45) },
    { id: "food", label: "Groceries & Food", emoji: "🛒", required: true, suggested: Math.round(netIncome * 0.12), min: 100, max: Math.round(netIncome * 0.2) },
    { id: "transport", label: "Transportation", emoji: "🚗", required: true, suggested: Math.round(netIncome * 0.1), min: 50, max: Math.round(netIncome * 0.2) },
    { id: "entertainment", label: "Entertainment", emoji: "🎬", required: false, suggested: Math.round(netIncome * 0.08), min: 0, max: Math.round(netIncome * 0.2) },
    { id: "health", label: "Health & Fitness", emoji: "💪", required: false, suggested: Math.round(netIncome * 0.05), min: 0, max: Math.round(netIncome * 0.1) },
  ];

  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(EXPENSES.map(e => [e.id, e.suggested]))
  );

  const totalSpent = Object.values(values).reduce((a, b) => a + b, 0);
  const saved = netIncome - totalSpent;
  const savingsPct = (saved / netIncome * 100).toFixed(1);
  const isOver = saved < 0;

  const feedback = () => {
    if (isOver) return { msg: "You're spending more than you earn! Trim expenses.", color: "text-brand-coral" };
    if (saved / netIncome >= 0.2) return { msg: "Excellent! 20%+ savings rate — on track for financial freedom.", color: "text-brand-mint" };
    if (saved / netIncome >= 0.1) return { msg: "Good! 10%+ savings. Aim for 20% for faster wealth building.", color: "text-brand-blue" };
    return { msg: "Low savings rate. Try cutting discretionary spending.", color: "text-orange-500" };
  };

  const fb = feedback();

  return (
    <div className="card-base flex flex-col gap-5 shadow-xl !border-brand-mint/20">
      <div className="flex items-center gap-2">
        <div className="bg-brand-mint/10 p-2 rounded-xl"><DollarSign size={20} className="text-brand-mint" /></div>
        <div>
          <h3 className="font-black text-base">Monthly Budget 💰</h3>
          <p className="text-xs text-[var(--text-muted)]">Age {age} — allocate your ${netIncome}/month take-home.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {EXPENSES.map((exp) => (
          <div key={exp.id} className="flex flex-col gap-1">
            <div className="flex justify-between text-sm">
              <span className="font-bold">{exp.emoji} {exp.label}{exp.required ? "" : " (optional)"}</span>
              <span className="font-black">${values[exp.id]}</span>
            </div>
            <input type="range" min={exp.min} max={exp.max} step={10} value={values[exp.id]}
              onChange={e => setValues(v => ({ ...v, [exp.id]: Number(e.target.value) }))}
              className="w-full accent-brand-mint h-2 rounded-full" />
          </div>
        ))}
      </div>

      <div className={`p-3 rounded-2xl flex justify-between items-center ${isOver ? "bg-brand-coral/10 border border-brand-coral/30" : "bg-brand-mint/10 border border-brand-mint/20"}`}>
        <span className="font-bold text-sm">Monthly Savings</span>
        <span className={`font-black text-lg ${isOver ? "text-brand-coral" : "text-brand-mint"}`}>
          {isOver ? "-" : "+"}${Math.abs(saved)} ({savingsPct}%)
        </span>
      </div>

      <p className={`text-sm font-bold ${fb.color}`}>💡 {fb.msg}</p>

      <button onClick={() => onComplete(Math.max(0, saved))} disabled={isOver}
        className={`w-full py-3.5 rounded-2xl font-black transition-all ${
          isOver ? "bg-slate-100 dark:bg-slate-800 text-slate-400"
            : "bg-slate-900 dark:bg-brand-mint text-white dark:text-emerald-900"
        }`}>
        Lock In Budget →
      </button>
    </div>
  );
}

// ─── Character Creator ────────────────────────────────────────────────────────

function CharacterCreator({ onStart }: { onStart: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
      <div className="text-center flex flex-col gap-3">
        <span className="text-6xl">👶</span>
        <h2 className="text-2xl font-black">Your Life Begins</h2>
        <p className="text-[var(--text-muted)] text-sm leading-relaxed">
          Balance happiness, health, and intelligence while building real wealth.
          Make the right financial choices to retire comfortably at 65!
        </p>
      </div>

      <div className="card-base flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {[
            { icon: "😊", label: "Happiness", desc: "Stay joyful" },
            { icon: "💪", label: "Health", desc: "Stay active" },
            { icon: "🧠", label: "Intelligence", desc: "Keep learning" },
          ].map(s => (
            <div key={s.label} className="bg-[var(--bg-main)] rounded-2xl p-3 flex flex-col gap-1 items-center">
              <span className="text-2xl">{s.icon}</span>
              <span className="font-black">{s.label}</span>
              <span className="text-[var(--text-muted)]">{s.desc}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-center text-brand-coral font-bold">⚠️ Any stat below 20 = game over. Balance all areas of life!</p>
        <p className="text-xs text-center text-[var(--text-muted)]">🏆 Goal: reach age 65 with $200k+ in total wealth</p>
      </div>

      <div className="card-base flex flex-col gap-3">
        <label className="font-black text-sm uppercase tracking-wider text-[var(--text-muted)]">Your Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter your character's name..."
          className="w-full p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] font-bold text-[var(--text-main)] placeholder:text-slate-400 outline-none focus:border-brand-purple transition-colors"
        />
        <button
          onClick={() => name.trim() && onStart(name.trim())}
          disabled={!name.trim()}
          className={`w-full py-4 rounded-2xl font-black text-base transition-all ${
            name.trim() ? "bg-slate-900 dark:bg-brand-purple text-white shadow-lg" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
          }`}
        >
          Begin Life →
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Game ────────────────────────────────────────────────────────────────

type GamePhase = "scenario" | "result" | "tax" | "invest" | "budget" | "surprise";

const DEFAULT_LIFE: LifeState = {
  name: "",
  age: 8,
  money: 50,
  happiness: 70,
  health: 75,
  intelligence: 50,
  salary: 0,
  investments: 0,
  gameOver: false,
  gameWon: false,
  log: [],
  scenarioIndex: 0,
};

export interface LifeRunSummary {
  finalAge: number;
  finalWealth: number;
  finalIntelligence: number;
  won: boolean;
  /** Choice texts the player picked, useful for ribbon analysis */
  choicesMade: string[];
}

interface LifeTabProps {
  onLifeEnded?: (summary: LifeRunSummary) => void;
  /** Optional: each scenario advance fires this for quest progress */
  onYearAdvanced?: () => void;
}

export default function LifeTab({ onLifeEnded, onYearAdvanced }: LifeTabProps = {}) {
  const [choiceLog, setChoiceLog] = useState<string[]>([]);
  const [life, setLife] = useState<LifeState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_LIFE;
    } catch { return DEFAULT_LIFE; }
  });

  const [phase, setPhase] = useState<GamePhase>("scenario");
  const [resultText, setResultText] = useState("");
  const [resultPositive, setResultPositive] = useState(true);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [usedScenarioIds, setUsedScenarioIds] = useState<string[]>([]);
  const [deltas, setDeltas] = useState<Partial<StatDeltas>>({});
  const [currentSurprise, setCurrentSurprise] = useState<SurpriseEvent | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(life));
  }, [life]);

  // Pick scenario whenever age changes
  useEffect(() => {
    if (life.name && !life.gameOver && !life.gameWon) {
      setCurrentScenario(pickScenario(life.age, usedScenarioIds));
    }
  }, [life.age, life.name]);

  const applyDeltas = (d: Partial<StatDeltas>) => {
    setDeltas(d);
    setTimeout(() => setDeltas({}), 2500);
  };

  const updateLife = (patch: Partial<LifeState>) => {
    setLife(prev => {
      const next = { ...prev, ...patch };
      next.happiness = clamp(next.happiness);
      next.health = clamp(next.health);
      next.intelligence = clamp(next.intelligence);
      next.money = Math.max(0, next.money);
      // Check stat-based game over (unless already set in patch)
      if (!next.gameOver && !next.gameWon) {
        next.gameOver = next.happiness <= STAT_MIN || next.health <= STAT_MIN || next.intelligence <= STAT_MIN;
      }
      return next;
    });
  };

  const applyChoice = (choice: Choice) => {
    setChoiceLog(prev => [...prev, choice.text]);
    const dHappy = choice.happiness ?? 0;
    const dHealth = choice.health ?? 0;
    const dIntel = choice.intelligence ?? 0;
    const dMoney = choice.money ?? 0;

    applyDeltas({ happiness: dHappy, health: dHealth, intelligence: dIntel, money: dMoney });

    updateLife({
      money: Math.max(0, life.money + dMoney),
      happiness: clamp(life.happiness + dHappy),
      health: clamp(life.health + dHealth),
      intelligence: clamp(life.intelligence + dIntel),
      investments: life.investments + (choice.investments ?? 0),
      salary: life.salary + (choice.salary ?? 0),
    });

    if (currentScenario) setUsedScenarioIds(prev => [...prev, currentScenario.id]);
    setResultText(choice.result);
    setResultPositive(dMoney >= -100 && dHappy >= 0);
    setPhase("result");
  };

  const advanceYear = () => {
    const newAge = life.age + 1;
    onYearAdvanced?.();

    // Natural stat changes per year
    const healthDecay = newAge > 45 ? -1 : newAge > 35 ? -0.5 : 0;
    const happinessDrift = 0;

    const newHealth = clamp(life.health + healthDecay);
    const newHappiness = clamp(life.happiness + happinessDrift);
    const passiveIncome = life.salary + Math.round(life.investments * 0.007);
    const newMoney = life.money + passiveIncome;

    applyDeltas({ health: Math.round(healthDecay), money: passiveIncome });

    // Stat failure
    const statFailed = newHealth <= STAT_MIN || newHappiness <= STAT_MIN || life.intelligence <= STAT_MIN;
    if (statFailed) {
      updateLife({ age: newAge, money: newMoney, health: newHealth, happiness: newHappiness, gameOver: true });
      onLifeEnded?.({
        finalAge: newAge,
        finalWealth: newMoney + life.investments,
        finalIntelligence: life.intelligence,
        won: false,
        choicesMade: choiceLog,
      });
      return;
    }

    // Retirement
    if (newAge >= WIN_AGE) {
      const totalWealth = newMoney + life.investments;
      const won = totalWealth >= WIN_SAVINGS;
      updateLife({
        age: newAge, money: newMoney, health: newHealth, happiness: newHappiness,
        gameWon: won,
        gameOver: !won,
      });
      onLifeEnded?.({
        finalAge: newAge,
        finalWealth: totalWealth,
        finalIntelligence: life.intelligence,
        won,
        choicesMade: choiceLog,
      });
      return;
    }

    updateLife({ age: newAge, money: newMoney, health: newHealth, happiness: newHappiness });

    // Choose phase
    if (newAge === TAX_AGE) { setPhase("tax"); return; }
    if (newAge === INVEST_AGE) { setPhase("invest"); return; }
    if (BUDGET_AGES.has(newAge)) { setPhase("budget"); return; }

    // ~30% chance of a random surprise event each year instead of scenario
    if (Math.random() < 0.3) {
      const surprise = pickSurprise(newAge);
      if (surprise) {
        setCurrentSurprise(surprise);
        setPhase("surprise");
        return;
      }
    }

    setPhase("scenario");
  };

  const handleSurpriseAccept = () => {
    if (!currentSurprise) return;
    const e = currentSurprise.effects;
    applyDeltas({
      money: e.money ?? 0,
      happiness: e.happiness ?? 0,
      health: e.health ?? 0,
      intelligence: e.intelligence ?? 0,
    });
    updateLife({
      money: Math.max(0, life.money + (e.money ?? 0)),
      happiness: clamp(life.happiness + (e.happiness ?? 0)),
      health: clamp(life.health + (e.health ?? 0)),
      intelligence: clamp(life.intelligence + (e.intelligence ?? 0)),
      investments: life.investments + (e.investments ?? 0),
      salary: life.salary + (e.salary ?? 0),
    });
    setCurrentSurprise(null);
    setPhase("scenario");
  };

  const handleStart = (name: string) => {
    setLife({ ...DEFAULT_LIFE, name });
    setUsedScenarioIds([]);
    setDeltas({});
    setPhase("scenario");
  };

  const handleReset = () => {
    setLife(DEFAULT_LIFE);
    setUsedScenarioIds([]);
    setDeltas({});
    setPhase("scenario");
  };

  const handleTaxComplete = (correct: boolean) => {
    const dIntel = correct ? 15 : 5;
    applyDeltas({ intelligence: dIntel, money: correct ? 500 : 0 });
    updateLife({
      intelligence: clamp(life.intelligence + dIntel),
      money: life.money + (correct ? 500 : 0),
    });
    setResultText(
      correct
        ? "Correct! You calculated your take-home pay perfectly. +$500 bonus for financial literacy! 🎉"
        : `Not quite — but now you know! Net ≈ $${Math.round((life.salary * 12 || 36000) / 12 * (1 - 0.22 - 0.05 - 0.062 - 0.0145)).toLocaleString()}/month.`
    );
    setResultPositive(correct);
    setPhase("result");
  };

  const handleInvestComplete = (choice: string) => {
    const amount = Math.min(life.money, 10000);
    const bonus = choice === "index" ? 8 : choice === "savings" ? 3 : 0;
    const extra = choice === "index"
      ? "Great choice — index funds outperform most active managers long-term."
      : choice === "savings"
        ? "Safe but inflation will erode returns. Consider more equities over time."
        : "High risk! Most long-term wealth is built with diversified index funds.";
    applyDeltas({ intelligence: bonus, money: -amount });
    updateLife({ investments: life.investments + amount, money: Math.max(0, life.money - amount), intelligence: clamp(life.intelligence + bonus) });
    setResultText(`Allocated! ${extra}`);
    setResultPositive(choice === "index");
    setPhase("result");
  };

  const handleBudgetComplete = (saved: number) => {
    applyDeltas({ intelligence: 5, money: saved });
    updateLife({ money: life.money + saved, intelligence: clamp(life.intelligence + 5) });
    setResultText(`Budget locked! Saved $${saved}/month this year. Smart budgeting is the foundation of wealth.`);
    setResultPositive(saved > 200);
    setPhase("result");
  };

  // ── Screens ──────────────────────────────────────────────────────────────────

  if (!life.name) return <CharacterCreator onStart={handleStart} />;

  const totalWealth = life.money + life.investments;

  if (life.gameWon) {
    confetti({ particleCount: 200, spread: 80, origin: { y: 0.5 }, colors: ["#6EE7B7", "#C084FC", "#60A5FA"] });
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-6 text-center">
        <div className="card-base flex flex-col gap-4 items-center p-8">
          <span className="text-6xl">🏆</span>
          <h2 className="text-2xl font-black text-brand-mint">Retired Successfully!</h2>
          <p className="text-[var(--text-muted)] text-sm">
            {life.name} made it to {life.age}! Total wealth: <strong>{formatMoney(totalWealth)}</strong>. A life well lived!
          </p>
          <div className="grid grid-cols-3 gap-3 w-full mt-2">
            {[
              { label: "Happiness", value: life.happiness, emoji: "😊" },
              { label: "Health", value: life.health, emoji: "💪" },
              { label: "Intelligence", value: life.intelligence, emoji: "🧠" },
            ].map(s => (
              <div key={s.label} className="bg-[var(--bg-main)] rounded-2xl p-3 flex flex-col items-center gap-1">
                <span className="text-2xl">{s.emoji}</span>
                <span className="font-black text-lg">{s.value.toFixed(0)}</span>
                <span className="text-[10px] text-[var(--text-muted)]">{s.label}</span>
              </div>
            ))}
          </div>
          <button onClick={handleReset} className="w-full py-3.5 rounded-2xl font-black bg-slate-900 dark:bg-brand-purple text-white flex items-center justify-center gap-2">
            <RotateCcw size={16} /> Play Again
          </button>
        </div>
      </motion.div>
    );
  }

  if (life.gameOver) {
    const failedStat =
      life.happiness <= STAT_MIN ? "Happiness" :
      life.health <= STAT_MIN ? "Health" :
      life.intelligence <= STAT_MIN ? "Intelligence" :
      totalWealth < WIN_SAVINGS ? "Retirement Savings" : "Unknown";
    const isRetirementFail = failedStat === "Retirement Savings";
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-6 text-center">
        <div className="card-base flex flex-col gap-4 items-center p-8">
          <span className="text-6xl">{isRetirementFail ? "😔" : "💔"}</span>
          <h2 className="text-2xl font-black text-brand-coral">
            {isRetirementFail ? "Struggling Retirement" : "Game Over"}
          </h2>
          <p className="text-[var(--text-muted)] text-sm">
            {isRetirementFail
              ? `${life.name} reached 65 with only ${formatMoney(totalWealth)} — below the $200k goal. Retirement will be tough.`
              : `${life.name}'s ${failedStat} dropped too low at age ${life.age}. Life isn't just about money.`}
          </p>
          <div className="bg-[var(--bg-main)] rounded-2xl p-4 text-left w-full">
            <p className="font-black text-xs uppercase tracking-widest text-[var(--text-muted)] mb-2">Lesson Learned</p>
            <p className="text-sm font-bold">
              {failedStat === "Happiness" && "Never sacrifice all your joy for money. Experiences and relationships matter deeply."}
              {failedStat === "Health" && "Your health is your greatest wealth. No amount of money compensates for poor health."}
              {failedStat === "Intelligence" && "Keep learning! Continuous growth opens financial doors and protects from bad decisions."}
              {isRetirementFail && "Start saving early and consistently. Even small amounts compound dramatically over decades."}
            </p>
          </div>
          <p className="text-sm font-bold">Final wealth: <span className="text-brand-mint">{formatMoney(totalWealth)}</span></p>
          <button onClick={handleReset} className="w-full py-3.5 rounded-2xl font-black bg-slate-900 dark:bg-brand-purple text-white flex items-center justify-center gap-2">
            <RotateCcw size={16} /> Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  const ageLabel = getAgeLabel(life.age);
  const progressToRetirement = Math.min(100, ((life.age - 8) / (WIN_AGE - 8)) * 100);
  const wealthProgress = Math.min(100, (totalWealth / WIN_SAVINGS) * 100);

  return (
    <div className="flex flex-col gap-5">
      {/* Header card */}
      <div className="card-base flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{ageLabel.emoji}</span>
            <div>
              <h2 className="font-black text-xl">{life.name}</h2>
              <span className={`text-xs font-black uppercase tracking-widest ${ageLabel.color}`}>{ageLabel.label}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              <p className="font-black text-xl text-brand-mint">{formatMoney(totalWealth)}</p>
              {deltas.money !== undefined && deltas.money !== 0 && (
                <motion.span
                  key={`money-${deltas.money}`}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`text-xs font-black ${deltas.money > 0 ? "text-brand-mint" : "text-brand-coral"}`}
                >
                  {deltas.money > 0 ? "+" : ""}{formatMoney(deltas.money)}
                </motion.span>
              )}
            </div>
            <p className="text-[10px] text-[var(--text-muted)]">Age {life.age} · {formatMoney(life.investments)} invested</p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <StatBar label="Happiness" value={life.happiness} color="bg-yellow-400" icon={<Smile size={10} />} delta={deltas.happiness} />
          <StatBar label="Health" value={life.health} color="bg-brand-coral" icon={<Heart size={10} />} delta={deltas.health} />
          <StatBar label="Intelligence" value={life.intelligence} color="bg-brand-blue" icon={<Brain size={10} />} delta={deltas.intelligence} />
        </div>

        <div className="flex flex-col gap-2 pt-1 border-t border-[var(--border-color)]">
          <div className="flex justify-between text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">
            <span>Life Progress (Age {life.age}/65)</span>
            <span>{progressToRetirement.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200/60 dark:bg-slate-700/60 rounded-full overflow-hidden">
            <motion.div animate={{ width: `${progressToRetirement}%` }} className="h-full bg-brand-purple rounded-full" />
          </div>
          <div className="flex justify-between text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">
            <span>Retirement Fund ({formatMoney(totalWealth)}/{formatMoney(WIN_SAVINGS)})</span>
            <span>{wealthProgress.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200/60 dark:bg-slate-700/60 rounded-full overflow-hidden">
            <motion.div animate={{ width: `${wealthProgress}%` }} className="h-full bg-brand-mint rounded-full" />
          </div>
        </div>
      </div>

      {/* Game phase */}
      <AnimatePresence>
        {phase === "scenario" && currentScenario && (
          <motion.div key="scenario" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="card-base flex flex-col gap-5 shadow-xl">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{currentScenario.emoji}</span>
              <div>
                <h3 className="font-black text-base">{currentScenario.title}</h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-purple">Age {life.age}</span>
              </div>
            </div>
            <p className="text-sm text-[var(--text-main)] leading-relaxed font-medium">{currentScenario.description}</p>
            <div className="flex flex-col gap-2">
              {currentScenario.choices.map((choice, i) => (
                <motion.button key={i} whileTap={{ scale: 0.97 }} onClick={() => applyChoice(choice)}
                  className="text-left p-4 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-main)] hover:border-brand-purple/40 hover:bg-brand-purple/5 transition-all font-bold text-sm flex items-center gap-3">
                  <span className="text-[10px] font-black text-[var(--text-muted)] w-4">{String.fromCharCode(65 + i)}</span>
                  <span>{choice.text}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {phase === "scenario" && !currentScenario && (
          <motion.div key="free-year" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-base flex flex-col gap-4 items-center text-center p-8">
            <span className="text-4xl">📅</span>
            <h3 className="font-black text-lg">Year {life.age} — Quiet Year</h3>
            <p className="text-sm text-[var(--text-muted)]">A relatively uneventful year. Your investments grew and you kept saving.</p>
            <button onClick={advanceYear} className="w-full py-3.5 rounded-2xl font-black bg-slate-900 dark:bg-brand-purple text-white flex items-center justify-center gap-2">
              Advance to Age {life.age + 1} <ChevronRight size={16} />
            </button>
          </motion.div>
        )}

        {phase === "result" && (
          <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="card-base flex flex-col gap-4 items-center text-center p-6 shadow-2xl">
            <span className="text-4xl">{resultPositive ? "✅" : "⚠️"}</span>
            <p className="font-bold text-base leading-relaxed">{resultText}</p>
            <button onClick={advanceYear}
              className="w-full py-3.5 rounded-2xl font-black bg-slate-900 dark:bg-brand-purple text-white flex items-center justify-center gap-2">
              Next Year — Age {life.age + 1} <ChevronRight size={16} />
            </button>
          </motion.div>
        )}

        {phase === "surprise" && currentSurprise && (
          <motion.div
            key="surprise"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="card-base flex flex-col gap-4 items-center text-center p-6 shadow-2xl border-2 border-amber-500/40"
            style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.08), rgba(168,85,247,0.05))" }}
          >
            <span className="inline-block text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
              ✨ Surprise Event
            </span>
            <span className="text-5xl">{currentSurprise.emoji}</span>
            <h3 className="font-black text-lg">{currentSurprise.title}</h3>
            <p className="text-sm text-[var(--text-main)] leading-relaxed font-medium">
              {currentSurprise.description}
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center text-[10px] font-black">
              {currentSurprise.effects.money !== undefined && currentSurprise.effects.money !== 0 && (
                <Chip color={currentSurprise.effects.money > 0 ? "#22C55E" : "#EF4444"}>
                  {currentSurprise.effects.money > 0 ? "+" : ""}{currentSurprise.effects.money} $
                </Chip>
              )}
              {currentSurprise.effects.happiness !== undefined && currentSurprise.effects.happiness !== 0 && (
                <Chip color={currentSurprise.effects.happiness > 0 ? "#F59E0B" : "#EF4444"}>
                  {currentSurprise.effects.happiness > 0 ? "+" : ""}{currentSurprise.effects.happiness} 😊
                </Chip>
              )}
              {currentSurprise.effects.health !== undefined && currentSurprise.effects.health !== 0 && (
                <Chip color={currentSurprise.effects.health > 0 ? "#F43F5E" : "#EF4444"}>
                  {currentSurprise.effects.health > 0 ? "+" : ""}{currentSurprise.effects.health} ❤
                </Chip>
              )}
              {currentSurprise.effects.intelligence !== undefined && currentSurprise.effects.intelligence !== 0 && (
                <Chip color="#A855F7">
                  {currentSurprise.effects.intelligence > 0 ? "+" : ""}{currentSurprise.effects.intelligence} 🧠
                </Chip>
              )}
            </div>
            <button onClick={handleSurpriseAccept}
              className="w-full py-3.5 rounded-2xl font-black bg-gradient-to-r from-amber-500 to-violet-600 text-white flex items-center justify-center gap-2 shadow-lg">
              Continue — Age {life.age} <ChevronRight size={16} />
            </button>
          </motion.div>
        )}

        {phase === "tax" && (
          <motion.div key="tax" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <TaxMinigameCard data={getTaxData(life.salary)} onComplete={handleTaxComplete} />
          </motion.div>
        )}

        {phase === "invest" && (
          <motion.div key="invest" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <InvestMinigameCard data={{ amount: Math.min(life.money, 10000) }} onComplete={handleInvestComplete} />
          </motion.div>
        )}

        {phase === "budget" && (
          <motion.div key="budget" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <BudgetMinigameCard income={life.salary} age={life.age} onComplete={handleBudgetComplete} />
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={handleReset} className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-brand-coral transition-colors py-2">
        <RotateCcw size={12} /> Start Over
      </button>
    </div>
  );
}

// ─── Small chip for surprise-event stat deltas ────────────────────────────
function Chip({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span
      className="px-2 py-0.5 rounded-full font-black"
      style={{ backgroundColor: color + "20", color, border: `1px solid ${color}40` }}
    >
      {children}
    </span>
  );
}
