import { CheckCircle } from "lucide-react";

const benefits = [
  "Equipe especializada e dedicada",
  "Suporte 24 horas por dia",
  "Soluções personalizadas",
  "Tecnologia de ponta",
];

const About = () => {
  return (
    <section id="sobre" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          {/* Image/Illustration */}
          <div className="relative">
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <div className="text-6xl">🚀</div>
            </div>
          </div>

          {/* Content */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Sobre Nós
            </h2>
            <p className="text-muted-foreground mb-6">
              Somos uma empresa apaixonada por inovação e comprometida em
              entregar as melhores soluções para nossos clientes. Com anos de
              experiência no mercado, transformamos desafios em oportunidades.
            </p>
            <ul className="space-y-3">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
