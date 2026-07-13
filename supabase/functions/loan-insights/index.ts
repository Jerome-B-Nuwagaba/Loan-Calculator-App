import "@supabase/functions-js/edge-runtime.d.ts";

console.log("Loan Insights Function Started");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

Deno.serve(async (req) => {

  // Handle browser preflight request
  if (req.method === "OPTIONS") {
    return new Response(
      "ok",
      {
        headers: corsHeaders,
      }
    );
  }

  try {

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          error: "Only POST requests are allowed",
        }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
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
          status:400,
          headers:{
            ...corsHeaders,
            "Content-Type":"application/json",
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
4. Warning signs
`;


    // Temporary AI response
    // Temporary AI response
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

if (!GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY is not configured.");
}

const groqResponse = await fetch(
  "https://api.groq.com/openai/v1/chat/completions",
  {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are an experienced financial advisor. Give practical, balanced, easy-to-understand loan advice. Do not invent financial facts. Organize your response with headings.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  }
);

if (!groqResponse.ok) {
  const errorText = await groqResponse.text();
  throw new Error(`Groq API Error: ${errorText}`);
}

const groqData = await groqResponse.json();

const analysis =
  groqData.choices?.[0]?.message?.content ??
  "No analysis was returned by the AI.";

return new Response(
  JSON.stringify({
    message: "AI loan analysis generated successfully",
    analysis,
    metrics: {
      debtToIncomeRatio: dti
        ? `${dti.toFixed(2)}%`
        : null,
    },
  }),
  {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  }
);


  } catch(error){

    return new Response(
      JSON.stringify({
        error:error.message,
      }),
      {
        status:500,
        headers:{
          ...corsHeaders,
          "Content-Type":"application/json",
        },
      }
    );
  }

});