export interface CompatibilityItem {
  icon: string;
  title: string;
  url: string;
}

export interface FooterLink {
  description: string;
  icon: string;
  url: string;
}

export interface NavItem {
  title: string;
  url: string;
}

export interface ImgProyectoItem {
  alt: string;
  src: string;
}

export interface Project {
  slug: string;
  title: string;
  image?: string;
  url: string;
  featured?: number;
  section?: "proyectos" | "conceptos" | "vibecoding";
  specialPage?: boolean;
  description?: string[];
  technologies?: string[];
  images?: string[];
  demoUrl?: string;
  demoLabel?: string;
  thumbsCount?: number;
}