import type { Question, Quiz } from "@/types";
type DemoQuestion = Question & {
  correct_answer: string;
};

type DemoQuiz = Omit<Quiz, "questions"> & {
  questions: DemoQuestion[];
};

/*
 * Demo quiz curriculum.
 *
 * correct_answer is intentionally stored as an additional
 * runtime property on each question.
 *
 * Every lesson has a 5-question knowledge check:
 * - MCQ
 * - True / False
 * - Fill in the blank
 *
 * The existing QuizSection can continue using the normal
 * Question interface.
 */

const QUIZ_DATA: Record<string, DemoQuiz> = {
  /* ============================================================
     SIP EXPLAINED
  ============================================================ */

  "sip-explained": {
    id: "demo-sip-explained",
    lesson_id: "sips-mutual-funds-lesson-1",
    title: "SIP, Explained — Knowledge Check",
    passing_score: 70,
    max_attempts: 3,
    attempts_used: 0,

    questions: [
      {
        id: "sip-q1",
        question_text: "What does SIP stand for in mutual fund investing?",
        question_type: "mcq",
        options: [
          { key: "A", text: "Systematic Investment Plan" },
          { key: "B", text: "Standard Investment Portfolio" },
          { key: "C", text: "Secure Interest Program" },
          { key: "D", text: "System Investment Process" },
        ],
        difficulty: "beginner",
        points: 1,
        order_index: 1,
        correct_answer: "A",
      },

      {
        id: "sip-q2",
        question_text:
          "In a SIP, you normally invest a fixed amount at regular intervals.",
        question_type: "true_false",
        options: null,
        difficulty: "beginner",
        points: 1,
        order_index: 2,
        correct_answer: "true",
      },

      {
        id: "sip-q3",
        question_text:
          "What happens to the number of mutual fund units purchased when the NAV is lower and your SIP amount stays the same?",
        question_type: "mcq",
        options: [
          { key: "A", text: "You purchase more units" },
          { key: "B", text: "You purchase fewer units" },
          { key: "C", text: "You receive no units" },
          { key: "D", text: "The number of units never changes" },
        ],
        difficulty: "beginner",
        points: 1,
        order_index: 3,
        correct_answer: "A",
      },

      {
        id: "sip-q4",
        question_text:
          "What is the main idea behind rupee-cost averaging?",
        question_type: "mcq",
        options: [
          { key: "A", text: "Investing only when markets rise" },
          {
            key: "B",
            text: "Buying more units when prices are lower and fewer when prices are higher",
          },
          { key: "C", text: "Avoiding mutual funds completely" },
          { key: "D", text: "Guaranteeing a fixed return" },
        ],
        difficulty: "intermediate",
        points: 1,
        order_index: 4,
        correct_answer: "B",
      },

      {
        id: "sip-q5",
        question_text:
          "Complete the sentence: SIP investments in mutual funds are subject to market ______.",
        question_type: "fill_blank",
        options: null,
        difficulty: "beginner",
        points: 1,
        order_index: 5,
        correct_answer: "risk",
      },
    ],
  },

  /* ============================================================
     COMPOUNDING AT WORK
  ============================================================ */

  "compounding-at-work": {
    id: "demo-compounding-at-work",
    lesson_id: "sips-mutual-funds-lesson-2",
    title: "Compounding at Work — Knowledge Check",
    passing_score: 70,
    max_attempts: 3,
    attempts_used: 0,

    questions: [
      {
        id: "compound-q1",
        question_text: "What is compounding?",
        question_type: "mcq",
        options: [
          {
            key: "A",
            text: "Earning returns on both your original money and earlier returns",
          },
          {
            key: "B",
            text: "Keeping money in a bank without earning anything",
          },
          {
            key: "C",
            text: "Withdrawing investment returns every month",
          },
          { key: "D", text: "Paying a fee for investing" },
        ],
        difficulty: "beginner",
        points: 1,
        order_index: 1,
        correct_answer: "A",
      },

      {
        id: "compound-q2",
        question_text:
          "Compounding generally becomes more powerful when money remains invested for a longer period.",
        question_type: "true_false",
        options: null,
        difficulty: "beginner",
        points: 1,
        order_index: 2,
        correct_answer: "true",
      },

      {
        id: "compound-q3",
        question_text:
          "Which factor is especially important for allowing compounding to work over time?",
        question_type: "mcq",
        options: [
          { key: "A", text: "Time" },
          { key: "B", text: "Daily withdrawals" },
          { key: "C", text: "Avoiding all investments" },
          { key: "D", text: "Changing investments every week" },
        ],
        difficulty: "beginner",
        points: 1,
        order_index: 3,
        correct_answer: "A",
      },

      {
        id: "compound-q4",
        question_text:
          "Compounding can guarantee a positive return every year.",
        question_type: "true_false",
        options: null,
        difficulty: "intermediate",
        points: 1,
        order_index: 4,
        correct_answer: "false",
      },

      {
        id: "compound-q5",
        question_text:
          "Complete the sentence: The longer money stays invested, the more opportunity it has to benefit from ______.",
        question_type: "fill_blank",
        options: null,
        difficulty: "beginner",
        points: 1,
        order_index: 5,
        correct_answer: "compounding",
      },
    ],
  },

  /* ============================================================
     CHOOSING A MUTUAL FUND
  ============================================================ */

  "choosing-a-mutual-fund": {
    id: "demo-choosing-mutual-fund",
    lesson_id: "sips-mutual-funds-lesson-3",
    title: "Choosing a Mutual Fund — Knowledge Check",
    passing_score: 70,
    max_attempts: 3,
    attempts_used: 0,

    questions: [
      {
        id: "mf-q1",
        question_text:
          "What should you consider before choosing a mutual fund?",
        question_type: "mcq",
        options: [
          {
            key: "A",
            text: "Only its highest recent return",
          },
          {
            key: "B",
            text: "Your goal, time horizon and risk tolerance",
          },
          {
            key: "C",
            text: "Only the fund's NAV",
          },
          {
            key: "D",
            text: "Only how popular the fund is",
          },
        ],
        difficulty: "beginner",
        points: 1,
        order_index: 1,
        correct_answer: "B",
      },

      {
        id: "mf-q2",
        question_text:
          "A lower NAV automatically means that a mutual fund is cheaper or better.",
        question_type: "true_false",
        options: null,
        difficulty: "beginner",
        points: 1,
        order_index: 2,
        correct_answer: "false",
      },

      {
        id: "mf-q3",
        question_text:
          "What does the expense ratio represent?",
        question_type: "mcq",
        options: [
          {
            key: "A",
            text: "The expenses charged by the mutual fund scheme",
          },
          {
            key: "B",
            text: "The guaranteed return from the fund",
          },
          {
            key: "C",
            text: "The investor's salary",
          },
          {
            key: "D",
            text: "The fund's NAV",
          },
        ],
        difficulty: "beginner",
        points: 1,
        order_index: 3,
        correct_answer: "A",
      },

      {
        id: "mf-q4",
        question_text:
          "Past performance guarantees the future returns of a mutual fund.",
        question_type: "true_false",
        options: null,
        difficulty: "beginner",
        points: 1,
        order_index: 4,
        correct_answer: "false",
      },

      {
        id: "mf-q5",
        question_text:
          "Complete the sentence: Before investing, you should understand your financial ______.",
        question_type: "fill_blank",
        options: null,
        difficulty: "beginner",
        points: 1,
        order_index: 5,
        correct_answer: "goal",
      },
    ],
  },

  /* ============================================================
     INDIAN STOCK MARKET — WHAT IS A STOCK?
  ============================================================ */

  "what-is-a-stock": {
    id: "demo-what-is-a-stock",
    lesson_id: "indian-stock-market-lesson-1",
    title: "What Is a Stock? — Knowledge Check",
    passing_score: 70,
    max_attempts: 3,
    attempts_used: 0,

    questions: [
      {
        id: "stock-q1",
        question_text: "What does owning a stock generally represent?",
        question_type: "mcq",
        options: [
          { key: "A", text: "Ownership in a company" },
          { key: "B", text: "A guaranteed bank deposit" },
          { key: "C", text: "A government salary" },
          { key: "D", text: "A fixed-interest loan" },
        ],
        difficulty: "beginner",
        points: 1,
        order_index: 1,
        correct_answer: "A",
      },

      {
        id: "stock-q2",
        question_text:
          "Companies can issue shares to raise capital.",
        question_type: "true_false",
        options: null,
        difficulty: "beginner",
        points: 1,
        order_index: 2,
        correct_answer: "true",
      },

      {
        id: "stock-q3",
        question_text:
          "Which of the following can provide a shareholder with a potential return?",
        question_type: "mcq",
        options: [
          { key: "A", text: "Capital appreciation" },
          { key: "B", text: "Dividends" },
          { key: "C", text: "Both A and B" },
          { key: "D", text: "Neither A nor B" },
        ],
        difficulty: "beginner",
        points: 1,
        order_index: 3,
        correct_answer: "C",
      },

      {
        id: "stock-q4",
        question_text:
          "A stock investment can lose value.",
        question_type: "true_false",
        options: null,
        difficulty: "beginner",
        points: 1,
        order_index: 4,
        correct_answer: "true",
      },

      {
        id: "stock-q5",
        question_text:
          "Complete the sentence: Market Capitalisation equals share price multiplied by shares ______.",
        question_type: "fill_blank",
        options: null,
        difficulty: "intermediate",
        points: 1,
        order_index: 5,
        correct_answer: "outstanding",
      },
    ],
  },

  /* ============================================================
     READING AN INDEX
  ============================================================ */

  "reading-an-index": {
    id: "demo-reading-index",
    lesson_id: "indian-stock-market-lesson-2",
    title: "Reading an Index — Knowledge Check",
    passing_score: 70,
    max_attempts: 3,
    attempts_used: 0,

    questions: [
      {
        id: "index-q1",
        question_text: "What does a market index generally do?",
        question_type: "mcq",
        options: [
          {
            key: "A",
            text: "Tracks a selected group of securities",
          },
          {
            key: "B",
            text: "Guarantees stock-market returns",
          },
          {
            key: "C",
            text: "Tracks only one investor's portfolio",
          },
          {
            key: "D",
            text: "Prevents market losses",
          },
        ],
        difficulty: "beginner",
        points: 1,
        order_index: 1,
        correct_answer: "A",
      },

      {
        id: "index-q2",
        question_text:
          "The Nifty 50 is a major Indian stock-market index.",
        question_type: "true_false",
        options: null,
        difficulty: "beginner",
        points: 1,
        order_index: 2,
        correct_answer: "true",
      },

      {
        id: "index-q3",
        question_text:
          "Which of these is another major Indian stock-market index?",
        question_type: "mcq",
        options: [
          { key: "A", text: "Sensex" },
          { key: "B", text: "GDP" },
          { key: "C", text: "CPI" },
          { key: "D", text: "GST" },
        ],
        difficulty: "beginner",
        points: 1,
        order_index: 3,
        correct_answer: "A",
      },

      {
        id: "index-q4",
        question_text:
          "If an index rises, every stock represented by the index must have risen.",
        question_type: "true_false",
        options: null,
        difficulty: "intermediate",
        points: 1,
        order_index: 4,
        correct_answer: "false",
      },

      {
        id: "index-q5",
        question_text:
          "Complete the sentence: An index is primarily a market ______ tool.",
        question_type: "fill_blank",
        options: null,
        difficulty: "beginner",
        points: 1,
        order_index: 5,
        correct_answer: "measurement",
      },
    ],
  },

  /* ============================================================
     RISK AND REWARD
  ============================================================ */

  "risk-and-reward": {
    id: "demo-risk-reward",
    lesson_id: "indian-stock-market-lesson-3",
    title: "Risk and Reward — Knowledge Check",
    passing_score: 70,
    max_attempts: 3,
    attempts_used: 0,

    questions: [
      {
        id: "risk-q1",
        question_text: "What does investment risk describe?",
        question_type: "mcq",
        options: [
          {
            key: "A",
            text: "The possibility of an unexpected outcome, including loss",
          },
          {
            key: "B",
            text: "A guaranteed return",
          },
          {
            key: "C",
            text: "The absence of market movement",
          },
          {
            key: "D",
            text: "A fixed salary",
          },
        ],
        difficulty: "beginner",
        points: 1,
        order_index: 1,
        correct_answer: "A",
      },

      {
        id: "risk-q2",
        question_text:
          "Diversification completely eliminates investment risk.",
        question_type: "true_false",
        options: null,
        difficulty: "beginner",
        points: 1,
        order_index: 2,
        correct_answer: "false",
      },

      {
        id: "risk-q3",
        question_text: "What does volatility describe?",
        question_type: "mcq",
        options: [
          {
            key: "A",
            text: "How much an investment's price changes",
          },
          {
            key: "B",
            text: "The investor's salary",
          },
          {
            key: "C",
            text: "A guaranteed return",
          },
          {
            key: "D",
            text: "The number of bank accounts owned",
          },
        ],
        difficulty: "beginner",
        points: 1,
        order_index: 3,
        correct_answer: "A",
      },

      {
        id: "risk-q4",
        question_text:
          "Risk tolerance and risk capacity mean exactly the same thing.",
        question_type: "true_false",
        options: null,
        difficulty: "intermediate",
        points: 1,
        order_index: 4,
        correct_answer: "false",
      },

      {
        id: "risk-q5",
        question_text:
          "Complete the sentence: Spreading investments across assets can reduce ______ risk.",
        question_type: "fill_blank",
        options: null,
        difficulty: "beginner",
        points: 1,
        order_index: 5,
        correct_answer: "concentration",
      },
    ],
  },

  /* ============================================================
     ASSET ALLOCATION
  ============================================================ */

  "asset-allocation": {
    id: "demo-asset-allocation",
    lesson_id: "portfolio-investing-lesson-1",
    title: "Asset Allocation — Knowledge Check",
    passing_score: 70,
    max_attempts: 3,
    attempts_used: 0,

    questions: [
      {
        id: "allocation-q1",
        question_text: "What is asset allocation?",
        question_type: "mcq",
        options: [
          {
            key: "A",
            text: "Deciding how investment money is distributed across asset classes",
          },
          {
            key: "B",
            text: "Buying only one stock",
          },
          {
            key: "C",
            text: "Avoiding all investments",
          },
          {
            key: "D",
            text: "Choosing a bank account password",
          },
        ],
        difficulty: "beginner",
        points: 1,
        order_index: 1,
        correct_answer: "A",
      },

      {
        id: "allocation-q2",
        question_text:
          "Different asset classes can have different risk and return characteristics.",
        question_type: "true_false",
        options: null,
        difficulty: "beginner",
        points: 1,
        order_index: 2,
        correct_answer: "true",
      },

      {
        id: "allocation-q3",
        question_text:
          "Which factor should influence an investor's asset allocation?",
        question_type: "mcq",
        options: [
          { key: "A", text: "Financial goals" },
          { key: "B", text: "Time horizon" },
          { key: "C", text: "Risk tolerance" },
          { key: "D", text: "All of the above" },
        ],
        difficulty: "beginner",
        points: 1,
        order_index: 3,
        correct_answer: "D",
      },

      {
        id: "allocation-q4",
        question_text:
          "There is one universal asset allocation that is correct for every investor.",
        question_type: "true_false",
        options: null,
        difficulty: "intermediate",
        points: 1,
        order_index: 4,
        correct_answer: "false",
      },

      {
        id: "allocation-q5",
        question_text:
          "Complete the sentence: Asset allocation determines how money is distributed among asset ______.",
        question_type: "fill_blank",
        options: null,
        difficulty: "beginner",
        points: 1,
        order_index: 5,
        correct_answer: "classes",
      },
    ],
  },

  /* ============================================================
     REBALANCING BASICS
  ============================================================ */

  "rebalancing-basics": {
    id: "demo-rebalancing",
    lesson_id: "portfolio-investing-lesson-2",
    title: "Rebalancing Basics — Knowledge Check",
    passing_score: 70,
    max_attempts: 3,
    attempts_used: 0,

    questions: [
      {
        id: "rebalance-q1",
        question_text: "What does portfolio rebalancing mean?",
        question_type: "mcq",
        options: [
          {
            key: "A",
            text: "Bringing the portfolio back towards its intended allocation",
          },
          {
            key: "B",
            text: "Selling every investment",
          },
          {
            key: "C",
            text: "Only buying the best-performing asset",
          },
          {
            key: "D",
            text: "Avoiding portfolio reviews",
          },
        ],
        difficulty: "beginner",
        points: 1,
        order_index: 1,
        correct_answer: "A",
      },

      {
        id: "rebalance-q2",
        question_text:
          "Market movements can cause a portfolio's asset percentages to change.",
        question_type: "true_false",
        options: null,
        difficulty: "beginner",
        points: 1,
        order_index: 2,
        correct_answer: "true",
      },

      {
        id: "rebalance-q3",
        question_text:
          "Which approach can sometimes be used to rebalance a portfolio?",
        question_type: "mcq",
        options: [
          {
            key: "A",
            text: "Directing new contributions towards underweight assets",
          },
          {
            key: "B",
            text: "Ignoring the portfolio forever",
          },
          {
            key: "C",
            text: "Buying only the asset that recently rose",
          },
          {
            key: "D",
            text: "Removing all diversification",
          },
        ],
        difficulty: "intermediate",
        points: 1,
        order_index: 3,
        correct_answer: "A",
      },

      {
        id: "rebalance-q4",
        question_text:
          "Rebalancing guarantees higher investment returns.",
        question_type: "true_false",
        options: null,
        difficulty: "beginner",
        points: 1,
        order_index: 4,
        correct_answer: "false",
      },

      {
        id: "rebalance-q5",
        question_text:
          "Complete the sentence: Rebalancing helps maintain an intended portfolio ______.",
        question_type: "fill_blank",
        options: null,
        difficulty: "beginner",
        points: 1,
        order_index: 5,
        correct_answer: "allocation",
      },
    ],
  },

  /* ============================================================
     ORDERS AND EXECUTION
  ============================================================ */

  "orders-and-execution": {
    id: "demo-orders-execution",
    lesson_id: "trading-fundamentals-lesson-1",
    title: "Orders and Execution — Knowledge Check",
    passing_score: 70,
    max_attempts: 3,
    attempts_used: 0,

    questions: [
      {
        id: "orders-q1",
        question_text: "What is a market order?",
        question_type: "mcq",
        options: [
          {
            key: "A",
            text: "An order that prioritizes execution at available market prices",
          },
          {
            key: "B",
            text: "An order that guarantees a specific price",
          },
          {
            key: "C",
            text: "An order that can never execute",
          },
          {
            key: "D",
            text: "An order for a bank deposit",
          },
        ],
        difficulty: "beginner",
        points: 1,
        order_index: 1,
        correct_answer: "A",
      },

      {
        id: "orders-q2",
        question_text:
          "A limit order specifies a price condition for the trade.",
        question_type: "true_false",
        options: null,
        difficulty: "beginner",
        points: 1,
        order_index: 2,
        correct_answer: "true",
      },

      {
        id: "orders-q3",
        question_text:
          "What is the difference between the bid and ask commonly called?",
        question_type: "mcq",
        options: [
          { key: "A", text: "Bid-ask spread" },
          { key: "B", text: "Expense ratio" },
          { key: "C", text: "Market capitalisation" },
          { key: "D", text: "Dividend yield" },
        ],
        difficulty: "intermediate",
        points: 1,
        order_index: 3,
        correct_answer: "A",
      },

      {
        id: "orders-q4",
        question_text:
          "The exact execution price of a market order is always guaranteed.",
        question_type: "true_false",
        options: null,
        difficulty: "intermediate",
        points: 1,
        order_index: 4,
        correct_answer: "false",
      },

      {
        id: "orders-q5",
        question_text:
          "Complete the sentence: The difference between the bid and ask is called the bid-ask ______.",
        question_type: "fill_blank",
        options: null,
        difficulty: "beginner",
        points: 1,
        order_index: 5,
        correct_answer: "spread",
      },
    ],
  },

  /* ============================================================
     A TRADER'S RISK PLAN
  ============================================================ */

  "a-traders-risk-plan": {
    id: "demo-trader-risk-plan",
    lesson_id: "trading-fundamentals-lesson-2",
    title: "A Trader's Risk Plan — Knowledge Check",
    passing_score: 70,
    max_attempts: 3,
    attempts_used: 0,

    questions: [
      {
        id: "trader-risk-q1",
        question_text: "Why is risk management important in trading?",
        question_type: "mcq",
        options: [
          {
            key: "A",
            text: "It helps define and control potential losses",
          },
          {
            key: "B",
            text: "It guarantees every trade will win",
          },
          {
            key: "C",
            text: "It eliminates market volatility",
          },
          {
            key: "D",
            text: "It guarantees profits",
          },
        ],
        difficulty: "beginner",
        points: 1,
        order_index: 1,
        correct_answer: "A",
      },

      {
        id: "trader-risk-q2",
        question_text:
          "A stop-loss can help define a planned exit when a trade moves against the trader.",
        question_type: "true_false",
        options: null,
        difficulty: "beginner",
        points: 1,
        order_index: 2,
        correct_answer: "true",
      },

      {
        id: "trader-risk-q3",
        question_text: "What does position size determine?",
        question_type: "mcq",
        options: [
          {
            key: "A",
            text: "How much capital is exposed to a trade",
          },
          {
            key: "B",
            text: "The company's annual salary",
          },
          {
            key: "C",
            text: "The market's closing time",
          },
          {
            key: "D",
            text: "The investor's tax bracket",
          },
        ],
        difficulty: "beginner",
        points: 1,
        order_index: 3,
        correct_answer: "A",
      },

      {
        id: "trader-risk-q4",
        question_text:
          "A risk-reward ratio guarantees that a trade will be profitable.",
        question_type: "true_false",
        options: null,
        difficulty: "intermediate",
        points: 1,
        order_index: 4,
        correct_answer: "false",
      },

      {
        id: "trader-risk-q5",
        question_text:
          "Complete the sentence: A trader can record trades and decisions in a trading ______.",
        question_type: "fill_blank",
        options: null,
        difficulty: "beginner",
        points: 1,
        order_index: 5,
        correct_answer: "journal",
      },
    ],
  },

  /* ============================================================
     MARKETS WITHOUT BORDERS
  ============================================================ */

  "markets-without-borders": {
    id: "demo-markets-without-borders",
    lesson_id: "global-markets-lesson-1",
    title: "Markets Without Borders — Knowledge Check",
    passing_score: 70,
    max_attempts: 3,
    attempts_used: 0,

    questions: [
      {
        id: "global-q1",
        question_text:
          "Why can events in one country affect markets in another country?",
        question_type: "mcq",
        options: [
          {
            key: "A",
            text: "Financial markets and economies are interconnected",
          },
          {
            key: "B",
            text: "Countries have identical economies",
          },
          {
            key: "C",
            text: "Markets never move independently",
          },
          {
            key: "D",
            text: "All currencies have the same value",
          },
        ],
        difficulty: "beginner",
        points: 1,
        order_index: 1,
        correct_answer: "A",
      },

      {
        id: "global-q2",
        question_text:
          "Global interest-rate decisions can influence financial markets in other countries.",
        question_type: "true_false",
        options: null,
        difficulty: "beginner",
        points: 1,
        order_index: 2,
        correct_answer: "true",
      },

      {
        id: "global-q3",
        question_text:
          "Which factor can affect Indian markets through global connections?",
        question_type: "mcq",
        options: [
          { key: "A", text: "Crude-oil prices" },
          { key: "B", text: "Global interest rates" },
          { key: "C", text: "Geopolitical events" },
          { key: "D", text: "All of the above" },
        ],
        difficulty: "beginner",
        points: 1,
        order_index: 3,
        correct_answer: "D",
      },

      {
        id: "global-q4",
        question_text:
          "International investing has no additional risks compared with domestic investing.",
        question_type: "true_false",
        options: null,
        difficulty: "intermediate",
        points: 1,
        order_index: 4,
        correct_answer: "false",
      },

      {
        id: "global-q5",
        question_text:
          "Complete the sentence: International investing can introduce ______ risk.",
        question_type: "fill_blank",
        options: null,
        difficulty: "beginner",
        points: 1,
        order_index: 5,
        correct_answer: "currency",
      },
    ],
  },

  /* ============================================================
     CURRENCY AND INFLATION
  ============================================================ */

  "currency-and-inflation": {
    id: "demo-currency-inflation",
    lesson_id: "global-markets-lesson-2",
    title: "Currency and Inflation — Knowledge Check",
    passing_score: 70,
    max_attempts: 3,
    attempts_used: 0,

    questions: [
      {
        id: "currency-q1",
        question_text: "What does inflation generally mean?",
        question_type: "mcq",
        options: [
          {
            key: "A",
            text: "A sustained increase in the general price level",
          },
          {
            key: "B",
            text: "A guaranteed increase in investment returns",
          },
          {
            key: "C",
            text: "A decrease in every product's price",
          },
          {
            key: "D",
            text: "A fixed exchange rate",
          },
        ],
        difficulty: "beginner",
        points: 1,
        order_index: 1,
        correct_answer: "A",
      },

      {
        id: "currency-q2",
        question_text:
          "Higher inflation can reduce the purchasing power of money.",
        question_type: "true_false",
        options: null,
        difficulty: "beginner",
        points: 1,
        order_index: 2,
        correct_answer: "true",
      },

      {
        id: "currency-q3",
        question_text:
          "What does an exchange rate describe?",
        question_type: "mcq",
        options: [
          {
            key: "A",
            text: "The relative value of one currency against another",
          },
          {
            key: "B",
            text: "The inflation rate of every country",
          },
          {
            key: "C",
            text: "The stock price of one company",
          },
          {
            key: "D",
            text: "A mutual fund's expense ratio",
          },
        ],
        difficulty: "beginner",
        points: 1,
        order_index: 3,
        correct_answer: "A",
      },

      {
        id: "currency-q4",
        question_text:
          "Long-term financial goals can ignore inflation because prices never change.",
        question_type: "true_false",
        options: null,
        difficulty: "beginner",
        points: 1,
        order_index: 4,
        correct_answer: "false",
      },

      {
        id: "currency-q5",
        question_text:
          "Complete the sentence: Inflation affects the purchasing ______ of money.",
        question_type: "fill_blank",
        options: null,
        difficulty: "beginner",
        points: 1,
        order_index: 5,
        correct_answer: "power",
      },
    ],
  },

  /* ============================================================
     BUILDING YOUR SAFETY NET
  ============================================================ */

  "building-your-safety-net": {
    id: "demo-building-safety-net",
    lesson_id: "financial-foundations-lesson-3",
    title: "Building Your Safety Net — Knowledge Check",
    passing_score: 70,
    max_attempts: 3,
    attempts_used: 0,

    questions: [
      {
        id: "safety-net-q1",
        question_text:
          "What is the main purpose of an emergency fund?",
        question_type: "mcq",
        options: [
          {
            key: "A",
            text: "To cover unexpected expenses without depending on high-cost debt",
          },
          {
            key: "B",
            text: "To maximise short-term investment returns",
          },
          {
            key: "C",
            text: "To replace all long-term investments",
          },
          {
            key: "D",
            text: "To guarantee income during every financial situation",
          },
        ],
        difficulty: "beginner",
        points: 1,
        order_index: 1,
        correct_answer: "A",
      },

      {
        id: "safety-net-q2",
        question_text:
          "An emergency fund can help protect long-term investments when an unexpected expense occurs.",
        question_type: "true_false",
        options: null,
        difficulty: "beginner",
        points: 1,
        order_index: 2,
        correct_answer: "true",
      },

      {
        id: "safety-net-q3",
        question_text:
          "Which characteristic is generally most important for money kept for emergencies?",
        question_type: "mcq",
        options: [
          {
            key: "A",
            text: "Easy access when the money is needed",
          },
          {
            key: "B",
            text: "Maximum possible market volatility",
          },
          {
            key: "C",
            text: "A very long lock-in period",
          },
          {
            key: "D",
            text: "Investing it entirely in speculative assets",
          },
        ],
        difficulty: "beginner",
        points: 1,
        order_index: 3,
        correct_answer: "A",
      },

      {
        id: "safety-net-q4",
        question_text:
          "A financial safety net is only useful for people who have high incomes.",
        question_type: "true_false",
        options: null,
        difficulty: "intermediate",
        points: 1,
        order_index: 4,
        correct_answer: "false",
      },

      {
        id: "safety-net-q5",
        question_text:
          "Complete the sentence: An emergency fund is designed to cover unexpected ______.",
        question_type: "fill_blank",
        options: null,
        difficulty: "beginner",
        points: 1,
        order_index: 5,
        correct_answer: "expenses",
      },
    ],
  },

};

/* ================================================================
   GET DEMO QUIZ
================================================================ */

export function getDemoQuiz(
  lessonSlug: string
): Quiz | undefined {
  return QUIZ_DATA[lessonSlug];
}
