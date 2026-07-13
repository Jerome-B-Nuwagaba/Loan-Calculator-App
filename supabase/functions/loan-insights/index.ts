import "@supabase/functions-js/edge-runtime.d.ts";

console.log("Loan Insights Function Started");

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          error: "Only POST requests are allowed",
        }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const {
      loanAmount,
      interestRate,
      termMonths,
      monthlyIncome,
      existingDebt,
      monthlyPayment,
    } = await req.json();

    if (!loanAmount || !interestRate || !termMonths) {
      return new Response(
        JSON.stringify({
          error: "Missing required loan details",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const dti =
      monthlyIncome && existingDebt
        ? ((existingDebt + monthlyPayment) / monthlyIncome) * 100
        : null;


    const prompt = `
You are a financial advisor AI.

Analyze this loan scenario:

Loan Amount: $${loanAmount}
Interest Rate: ${interestRate}%
Term: ${termMonths} months
Monthly Payment: $${monthlyPayment}

Monthly Income: $${monthlyIncome ?? "Not provided"}
Existing Debt: $${existingDebt ?? "Not provided"}

Debt-to-Income Ratio:
${dti ? dti.toFixed(2) + "%" : "Not available"}

Provide:
1. Risk assessment
2. Affordability analysis
3. Three practical recommendations
4. Any warning signs

Keep the response clear and easy for a normal person to understand.
`;

    // Temporary response until Groq is connected
    return new Response(
      JSON.stringify({
        message: "Loan analysis prepared",
        prompt,
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
});