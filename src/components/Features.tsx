import { Zap, Shield, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Zap,
    title: "Rápido e Eficiente",
    description:
      "Soluções otimizadas que economizam seu tempo e aumentam sua produtividade.",
  },
  {
    icon: Shield,
    title: "Seguro e Confiável",
    description:
      "Proteção de dados de última geração para manter suas informações seguras.",
  },
  {
    icon: TrendingUp,
    title: "Resultados Reais",
    description:
      "Métricas claras e resultados mensuráveis para o crescimento do seu negócio.",
  },
];

const Features = () => {
  return (
    <section id="recursos" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Por que nos escolher?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Oferecemos as melhores soluções para o seu negócio, com foco em
            qualidade e resultados.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="bg-background border-border hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
