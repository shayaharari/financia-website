"use client";
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, ShieldCheck, Clock, Phone, FileText, ArrowRight, AlertTriangle, UserCheck, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const incomeRanges = [
  { label: "Menos de $500", value: 400 },
  { label: "$500 - $1,000", value: 750 },
  { label: "$1,000 - $2,000", value: 1500 },
  { label: "$2,000+", value: 2500 },
];

const debtRanges = [
  { label: "$0", value: 0 },
  { label: "$1 - $200", value: 100 },
  { label: "$200 - $500", value: 350 },
  { label: "$500+", value: 700 },
];

const workTimeScores = {
  "Menos de 3 meses": 5,
  "3 - 12 meses": 15,
  "1 - 3 años": 25,
  "3+ años": 30,
};

const employmentScores = {
  Asalariado: 25,
  "Dueño de negocio": 20,
  Independiente: 15,
  Freelancer: 12,
};

const translations = {
  es: {
    home: "Inicio",
    how: "Cómo funciona",
    faq: "Preguntas",
    admin: "Panel",
    applyNow: "Solicitar ahora",
    fastLoans: "Préstamos rápidos en Panamá",
    applyMinutes: "{t.applyMinutes}",
    heroTitle: "{t.heroTitle}",
    heroText: "Solicita un préstamo personal pequeño con un proceso rápido, seguro y responsable.",
    startApplication: "{t.startApplication}",
    checkEligibility: "{t.checkEligibility}",
    application: "Solicitud de préstamo",
    continue: "{t.continue}",
    back: "{t.back}",
    submit: "{t.submit}",
    success: "{t.success}",
    dashboard: "{t.dashboard}",
    language: "EN"
  },
  en: {
    home: "Home",
    how: "How it works",
    faq: "FAQ",
    admin: "Dashboard",
    applyNow: "Apply now",
    fastLoans: "Fast loans in Panama",
    applyMinutes: "Application in about 3 minutes",
    heroTitle: "Simple loans when you need them most.",
    heroText: "Request a small personal loan through a fast, secure, and responsible process.",
    startApplication: "Start application",
    checkEligibility: "Check eligibility",
    application: "Loan application",
    continue: "Continue",
    back: "Back",
    submit: "Submit application",
    success: "Application received",
    dashboard: "Application review",
    language: "ES"
  }
};

const initialForm = {
  fullName: "",
  cedula: "",
  phone: "",
  email: "",
  province: "",
  monthlyIncome: "",
  employmentType: "",
  timeWorking: "",
  loanAmount: "",
  loanTerm: "",
  loanPurpose: "",
  monthlyDebt: "",
  consent: false,
};

function calculateRisk(form: any) {
  const income = incomeRanges.find((x) => x.label === form.monthlyIncome)?.value || 0;
  const debt = debtRanges.find((x) => x.label === form.monthlyDebt)?.value || 0;
  const loan = Number(form.loanAmount || 0);
  const term = Number(form.loanTerm || 1);

  const estimatedPayment = loan && term ? loan / term : 0;
  const availableCash = Math.max(income - debt, 0);
  const paymentRatio = income ? estimatedPayment / income : 1;
  const availableCashRatio = availableCash ? estimatedPayment / availableCash : 1;
  const debtRatio = income ? debt / income : 1;
  const loanToIncome = income ? loan / income : 99;

  let score = 100;
  const flags = [];

  // 1. Income quality
  if (income < 500) {
    score -= 35;
    flags.push("Ingreso mensual muy bajo.");
  } else if (income < 1000) {
    score -= 18;
    flags.push("Ingreso mensual limitado.");
  } else if (income < 2000) {
    score -= 6;
  }

  // 2. Employment stability
  if (form.timeWorking === "Menos de 3 meses") {
    score -= 28;
    flags.push("Muy poco tiempo en el trabajo o negocio actual.");
  } else if (form.timeWorking === "3 - 12 meses") {
    score -= 14;
    flags.push("Estabilidad laboral todavía limitada.");
  } else if (form.timeWorking === "1 - 3 años") {
    score -= 4;
  }

  // 3. Employment type
  if (form.employmentType === "Freelancer") {
    score -= 12;
    flags.push("Ingreso potencialmente variable.");
  } else if (form.employmentType === "Independiente") {
    score -= 9;
    flags.push("Ingreso independiente requiere verificación adicional.");
  } else if (form.employmentType === "Dueño de negocio") {
    score -= 6;
  }

  // 4. Existing debt
  if (debtRatio > 0.45) {
    score -= 30;
    flags.push("Nivel de deuda mensual muy alto contra ingresos.");
  } else if (debtRatio > 0.30) {
    score -= 18;
    flags.push("Deuda mensual considerable.");
  } else if (debtRatio > 0.20) {
    score -= 8;
  }

  // 5. Monthly payment burden
  if (paymentRatio > 0.60) {
    score -= 45;
    flags.push("La cuota estimada supera el 60% del ingreso mensual.");
  } else if (paymentRatio > 0.40) {
    score -= 32;
    flags.push("La cuota estimada es demasiado alta para el ingreso.");
  } else if (paymentRatio > 0.25) {
    score -= 18;
    flags.push("La cuota estimada consume una parte alta del ingreso.");
  } else if (paymentRatio > 0.15) {
    score -= 8;
  }

  // 6. Payment vs available cash after debt
  if (availableCashRatio > 0.70) {
    score -= 35;
    flags.push("La cuota consume demasiado del dinero disponible después de deudas.");
  } else if (availableCashRatio > 0.50) {
    score -= 22;
    flags.push("La cuota es alta comparada con el dinero disponible.");
  } else if (availableCashRatio > 0.35) {
    score -= 10;
  }

  // 7. Loan amount vs income
  if (loanToIncome > 3) {
    score -= 35;
    flags.push("Monto solicitado muy alto comparado con ingreso mensual.");
  } else if (loanToIncome > 2) {
    score -= 24;
    flags.push("Monto solicitado alto comparado con ingreso mensual.");
  } else if (loanToIncome > 1) {
    score -= 12;
  }

  // 8. Term risk
  if (term <= 1 && loanToIncome > 0.5) {
    score -= 28;
    flags.push("Plazo de 1 mes agresivo para el monto solicitado.");
  } else if (term <= 3 && loanToIncome > 1.5) {
    score -= 18;
    flags.push("Plazo corto para el tamaño del préstamo.");
  }

  // Hard red flags
  if (estimatedPayment > availableCash) {
    score = Math.min(score, 42);
    flags.push("La cuota estimada supera el dinero disponible.");
  }

  if (loan >= 3000 && income < 1500) {
    score = Math.min(score, 38);
    flags.push("Monto alto para ingreso declarado.");
  }

  if (loan >= 5000 && term <= 3) {
    score = Math.min(score, 30);
    flags.push("Solicitud grande con plazo demasiado corto.");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let category = "Revisión Manual";
  let color = "bg-amber-100 text-amber-800";
  let recommendation = "Revisar documentos antes de tomar una decisión.";

  if (score >= 82) {
    category = "Cliente Fuerte";
    color = "bg-emerald-100 text-emerald-800";
    recommendation = "Buen perfil. Verificar documentos y considerar aprobación.";
  } else if (score >= 68) {
    category = "Buen Cliente";
    color = "bg-blue-100 text-blue-800";
    recommendation = "Perfil saludable, pero verificar ingresos, deudas y documentos.";
  } else if (score >= 50) {
    category = "Riesgo Medio";
    color = "bg-amber-100 text-amber-800";
    recommendation = "Requiere revisión manual. Considerar monto menor o plazo más largo.";
  } else {
    category = "Alto Riesgo";
    color = "bg-red-100 text-red-800";
    recommendation = "No aprobar automáticamente. Solicitar más respaldo o rechazar.";
  }

  return {
    score,
    category,
    color,
    recommendation,
    income,
    debt,
    loan,
    term,
    estimatedPayment,
    availableCash,
    paymentRatio,
    availableCashRatio,
    debtRatio,
    loanToIncome,
    flags,
  };
}

export default function LoanWebsiteMVP() {
  const [language, setLanguage] = useState("es");
  const t = translations[language];
  const [view, setView] = useState("home");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [applications, setApplications] = useState([]);

  const risk = useMemo(() => calculateRisk(form), [form]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const submitApplication = () => {
    const newApplication = {
      id: Date.now(),
      createdAt: new Date().toLocaleString(),
      ...form,
      risk: calculateRisk(form),
      status: "Nueva Solicitud",
    };
    setApplications((prev) => [newApplication, ...prev]);
    setView("success");
  };

  const resetApplication = () => {
    setForm(initialForm);
    setStep(1);
    setView("apply");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <button onClick={() => setView("home")} className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">F</div>
            <div className="text-left">
              <div className="text-lg font-bold leading-tight">Financia</div>
              <div className="text-xs text-slate-500">Préstamos rápidos en Panamá</div>
            </div>
          </button>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <button onClick={() => setView("home")}>{t.home}</button>
            <button onClick={() => setView("how")}>{t.how}</button>
            <button onClick={() => setView("faq")}>{t.faq}</button>
            <button onClick={() => setView("admin")}>{t.admin}</button>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage(language === "es" ? "en" : "es")}
              className="rounded-xl border px-3 py-2 text-sm font-semibold text-slate-700"
            >
              {t.language}
            </button>
            <Button onClick={() => setView("apply")} className="rounded-2xl">{t.applyNow}</Button>
          </div>
        </div>
      </header>

      {view === "home" && (
        <main>
          <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-2 md:items-center md:py-24">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
                <Clock className="h-4 w-4" /> Solicitud en aproximadamente 3 minutos
              </div>
              <h1 className="text-4xl font-bold tracking-tight md:text-6xl">Préstamos simples cuando más los necesitas.</h1>
              <p className="mt-5 text-lg leading-8 text-slate-600">{t.heroText}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button onClick={() => setView("apply")} size="lg" className="rounded-2xl px-7">Empezar solicitud <ArrowRight className="ml-2 h-4 w-4" /></Button>
                <Button onClick={() => setView("how")} variant="outline" size="lg" className="rounded-2xl px-7">Cómo funciona</Button>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                <div className="rounded-2xl bg-white p-4 shadow-sm"><div className="text-xl font-bold">$100+</div><div className="text-xs text-slate-500">Montos</div></div>
                <div className="rounded-2xl bg-white p-4 shadow-sm"><div className="text-xl font-bold">3 min</div><div className="text-xs text-slate-500">Solicitud</div></div>
                <div className="rounded-2xl bg-white p-4 shadow-sm"><div className="text-xl font-bold">Seguro</div><div className="text-xs text-slate-500">Revisión</div></div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <Card className="rounded-3xl border-0 shadow-xl">
                <CardContent className="p-7">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">Precalificación rápida</h2>
                      <p className="text-sm text-slate-500">Pocas preguntas. Revisión responsable.</p>
                    </div>
                    <ShieldCheck className="h-10 w-10 text-slate-700" />
                  </div>
                  <div className="space-y-4">
                    {[
                      "Cuéntanos quién eres",
                      "Elige el monto que necesitas",
                      "Comparte ingresos y obligaciones mensuales",
                      "Sube documentos solo si precalificas",
                    ].map((item, index) => (
                      <div key={item} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white font-bold shadow-sm">{index + 1}</div>
                        <div className="text-sm font-medium">{item}</div>
                      </div>
                    ))}
                  </div>
                  <Button onClick={() => setView("apply")} className="mt-6 w-full rounded-2xl" size="lg">Ver si califico</Button>
                </CardContent>
              </Card>
            </motion.div>
          </section>

          <section className="bg-white py-14">
            <div className="mx-auto grid max-w-6xl gap-5 px-5 md:grid-cols-3">
              <Feature icon={<Phone />} title="Fácil de completar" text="Primero pedimos solo lo esencial: nombre, cédula, teléfono, ingresos, empleo, monto solicitado y deudas." />
              <Feature icon={<UserCheck />} title="Aprobación responsable" text="La revisión se basa en capacidad real de pago, no solo en velocidad." />
              <Feature icon={<FileText />} title="Documentos después" text="La cédula y prueba de ingresos se solicitan después de la primera precalificación." />
            </div>
          </section>
        </main>
      )}

      {view === "how" && <InfoPage title="Cómo funciona" items={["Completa una solicitud corta de precalificación.", "Estimamos tu capacidad de pago usando ingresos, deudas, estabilidad laboral y monto solicitado.", "Si el perfil es saludable, solicitamos cédula y prueba de ingresos.", "Se completa una revisión final antes de aprobar y desembolsar el préstamo."]} />}
      {view === "faq" && <InfoPage title="Preguntas frecuentes" items={["¿Cuánto demora? La primera solicitud toma aproximadamente 3 minutos.", "¿Qué documentos necesito? Generalmente cédula y prueba de ingresos después de precalificar.", "¿La aprobación está garantizada? No. Todo préstamo depende de capacidad de pago y verificación.", "¿Mi información está segura? La plataforma debe usar consentimiento, cifrado y acceso restringido."]} />}

      {view === "apply" && (
        <main className="mx-auto max-w-3xl px-5 py-10">
          <div className="mb-7">
            <p className="text-sm font-semibold text-slate-500">Paso {step} de 3</p>
            <h1 className="text-3xl font-bold">{t.application}</h1>
            <p className="mt-2 text-slate-600">Esta versión mantiene el formulario corto, pero recoge lo necesario para evaluar capacidad de pago.</p>
          </div>

          <Card className="rounded-3xl border-0 shadow-lg">
            <CardContent className="p-6 md:p-8">
              {step === 1 && (
                <div className="space-y-5">
                  <SectionTitle title="Información básica" subtitle="Solo pedimos lo necesario para identificar y contactar al solicitante." />
                  <Input label="Nombre completo" value={form.fullName} onChange={(v) => update("fullName", v)} placeholder="Ejemplo: Juan Pérez" />
                  <Input label="Cédula o pasaporte" value={form.cedula} onChange={(v) => update("cedula", v)} placeholder="Ejemplo: 8-000-0000" />
                  <Input label="Celular" value={form.phone} onChange={(v) => update("phone", v)} placeholder="Ejemplo: +507 6000-0000" />
                  <Input label="Correo electrónico" value={form.email} onChange={(v) => update("email", v)} placeholder="ejemplo@email.com" />
                  <Select label="Provincia" value={form.province} onChange={(v) => update("province", v)} options={["Panamá", "Panamá Oeste", "Colón", "Chiriquí", "Coclé", "Herrera", "Los Santos", "Veraguas", "Bocas del Toro", "Darién", "Otra"]} />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <SectionTitle title="Ingresos y estabilidad" subtitle="Estas son las variables más importantes para prestar de forma responsable." />
                  <Select label="Ingreso mensual aproximado" value={form.monthlyIncome} onChange={(v) => update("monthlyIncome", v)} options={incomeRanges.map((x) => x.label)} />
                  <Select label="Tipo de trabajo" value={form.employmentType} onChange={(v) => update("employmentType", v)} options={["Asalariado", "Independiente", "Dueño de negocio", "Freelancer"]} />
                  <Select label="Tiempo en tu trabajo o negocio actual" value={form.timeWorking} onChange={(v) => update("timeWorking", v)} options={Object.keys(workTimeScores)} />
                  <Select label="Pagos mensuales de deudas actuales" value={form.monthlyDebt} onChange={(v) => update("monthlyDebt", v)} options={debtRanges.map((x) => x.label)} />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <SectionTitle title="Monto solicitado" subtitle="Comparamos el monto y plazo contra tu capacidad de pago." />
                  <Input label="Monto que deseas solicitar" type="number" value={form.loanAmount} onChange={(v) => update("loanAmount", v)} placeholder="Ejemplo: 500" />
                  <Select label="Plazo deseado" value={form.loanTerm} onChange={(v) => update("loanTerm", v)} options={["1", "2", "3", "6", "9", "12"]} suffix="meses" />
                  <Select label="Motivo del préstamo" value={form.loanPurpose} onChange={(v) => update("loanPurpose", v)} options={["Emergencia", "Negocio", "Gastos personales", "Educación", "Auto", "Hogar", "Otro"]} />
                  <label className="flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                    <input type="checkbox" checked={form.consent} onChange={(e) => update("consent", e.target.checked)} className="mt-1" />
                    <span>Confirmo que la información es verdadera y autorizo a la empresa a revisarla para fines de precalificación de préstamo.</span>
                  </label>

                  <div className="rounded-3xl border bg-white p-5">
  <h3 className="font-bold">Solicitud lista para enviar</h3>
  <p className="mt-2 text-sm text-slate-600">
    Revisaremos tu información de forma segura y te contactaremos con una respuesta lo antes posible.
  </p>
</div>
                </div>
              )}

              <div className="mt-8 flex justify-between gap-3">
                <Button variant="outline" className="rounded-2xl" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>Atrás</Button>
                {step < 3 ? (
                  <Button className="rounded-2xl" onClick={() => setStep((s) => s + 1)}>Continuar</Button>
                ) : (
                  <Button className="rounded-2xl" disabled={!form.consent} onClick={submitApplication}>Enviar solicitud</Button>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      )}

      {view === "success" && (
        <main className="mx-auto max-w-2xl px-5 py-20 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-emerald-600" />
          <h1 className="mt-5 text-3xl font-bold">Solicitud recibida</h1>
          <p className="mt-3 text-slate-600">Esta demo guardó la solicitud localmente y la agregó al panel interno de revisión.</p>
          <div className="mt-7 flex justify-center gap-3">
            <Button onClick={() => setView("admin")} className="rounded-2xl">Ver panel interno</Button>
            <Button onClick={resetApplication} variant="outline" className="rounded-2xl">Enviar otra</Button>
          </div>
        </main>
      )}

      {view === "admin" && (
        <main className="mx-auto max-w-6xl px-5 py-10">
          <div className="mb-7 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500">Panel interno</p>
              <h1 className="text-3xl font-bold">Revisión de solicitudes</h1>
            </div>
            <LayoutDashboard className="h-10 w-10 text-slate-500" />
          </div>

          {applications.length === 0 ? (
            <Card className="rounded-3xl border-0 shadow-sm"><CardContent className="p-8 text-center text-slate-600">Todavía no hay solicitudes. Envía una solicitud de prueba para ver el panel.</CardContent></Card>
          ) : (
            <div className="grid gap-5">
              {applications.map((app) => (
                <Card key={app.id} className="rounded-3xl border-0 shadow-md">
                  <CardContent className="grid gap-5 p-6 md:grid-cols-[1.2fr_.8fr]">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-bold">{app.fullName}</h2>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${app.risk.color}`}>{app.risk.category}</span>
                      </div>
                      <p className="text-sm text-slate-500">Enviado: {app.createdAt}</p>
                      <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                        <Detail label="Cédula" value={app.cedula} />
                        <Detail label="Celular" value={app.phone} />
                        <Detail label="Correo" value={app.email} />
                        <Detail label="Provincia" value={app.province} />
                        <Detail label="Trabajo" value={app.employmentType} />
                        <Detail label="Ingreso mensual" value={app.monthlyIncome} />
                        <Detail label="Deudas mensuales" value={app.monthlyDebt} />
                        <Detail label="Monto solicitado" value={`$${app.loanAmount}`} />
                        <Detail label="Plazo" value={`${app.loanTerm} meses`} />
                        <Detail label="Motivo" value={app.loanPurpose} />
                      </div>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-5">
                      <h3 className="font-bold">Análisis tipo IA</h3>
                      <div className="mt-4 text-4xl font-bold">{app.risk.score}/100</div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{app.risk.recommendation}</p>
                      <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">
                        Pago mensual estimado: <b>${app.risk.estimatedPayment.toFixed(2)}</b><br />
                        Disponible después de deudas: <b>${app.risk.availableCash.toFixed(2)}</b><br />
                        Carga del pago: <b>{Math.round(app.risk.paymentRatio * 100)}%</b>
                      </div>
                      {app.risk.score < 45 && (
                        <div className="mt-4 flex gap-2 rounded-2xl bg-red-50 p-3 text-sm text-red-700"><AlertTriangle className="h-5 w-5" />Alto riesgo: considerar rechazo o solicitar prueba de ingresos más sólida.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      )}

      <footer className="mt-10 border-t bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-3 px-5 text-sm text-slate-500 md:flex-row">
          <p>© 2026 Financia. Plataforma de préstamos responsables.</p>
          <p>Política de Privacidad · Términos · Contacto</p>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <Card className="rounded-3xl border-0 bg-slate-50 shadow-sm">
      <CardContent className="p-6">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">{React.cloneElement(icon, { className: "h-6 w-6 text-slate-800" })}</div>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
      </CardContent>
    </Card>
  );
}

function InfoPage({ title, items }) {
  return (
    <main className="mx-auto max-w-4xl px-5 py-14">
      <h1 className="text-4xl font-bold">{title}</h1>
      <div className="mt-8 grid gap-4">
        {items.map((item, index) => (
          <div key={item} className="flex gap-4 rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">{index + 1}</div>
            <p className="pt-1 leading-7 text-slate-700">{item}</p>
          </div>
        ))}
      </div>
    </main>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <div>
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-900" />
    </label>
  );
}

function Select({ label, value, onChange, options, suffix }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-900">
        <option value="">Selecciona {suffix ? `(${suffix})` : ""}</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}{suffix ? ` ${suffix}` : ""}</option>
        ))}
      </select>
    </label>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 font-medium text-slate-800">{value || "—"}</div>
    </div>
  );
}
