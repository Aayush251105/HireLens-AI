import { motion } from 'motion/react';
import { Building2, Rocket, Users } from 'lucide-react';

export type Persona = 'bigtech' | 'startup' | 'hr';

interface PersonaCardProps {
  persona: Persona;
  selected: boolean;
  onClick: () => void;
}

const personaData = {
  bigtech: {
    icon: Building2,
    title: 'Big Tech Recruiter',
    subtitle: 'FAANG Standards',
    description: 'Evaluates for quantifiable impact, scale, technical depth, and bar-raising excellence.',
    color: 'from-blue-500/20 to-indigo-500/20',
  },
  startup: {
    icon: Rocket,
    title: 'Startup Founder',
    subtitle: 'Series A Mindset',
    description: 'Values scrappiness, versatility, shipped products, and growth mindset over pedigree.',
    color: 'from-orange-500/20 to-pink-500/20',
  },
  hr: {
    icon: Users,
    title: 'HR Manager',
    subtitle: 'Culture & Fit',
    description: 'Focuses on cultural fit, role alignment, career progression, and professional presentation.',
    color: 'from-green-500/20 to-teal-500/20',
  },
};

export default function PersonaCard({ persona, selected, onClick }: PersonaCardProps) {
  const data = personaData[persona];
  const Icon = data.icon;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={`relative w-full text-left p-5 rounded-xl border transition-all duration-200 cursor-pointer ${
        selected
          ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(108,99,255,0.25)]'
          : 'border-border bg-card hover:border-primary/50 hover:shadow-[0_0_15px_rgba(108,99,255,0.15)]'
      }`}
    >
      {selected && (
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary" />
      )}
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${data.color} flex items-center justify-center mb-3 border border-white/10`}>
        <Icon className="w-5 h-5 text-foreground" />
      </div>
      <div className="mb-1">
        <span className="font-heading font-bold text-sm text-foreground">{data.title}</span>
        <span className="ml-2 text-xs text-primary font-medium">{data.subtitle}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{data.description}</p>
    </motion.button>
  );
}
