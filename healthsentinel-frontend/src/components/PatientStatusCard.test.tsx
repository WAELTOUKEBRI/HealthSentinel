import { render, screen } from '@testing-library/react';
import PatientStatusCard from './PatientStatusCard';
import '@testing-library/jest-dom';

// 1. Mock de Chart.js
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="mock-chart" />
}));

// 2. Mock de Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('PatientStatusCard Component', () => {
  const defaultProps = {
    id: "4002",
    name: "John Doe",
    ward: "ICU-01",
    heartRate: 115,
    status: "Stable" as const, // Type safety pour le status
  };

  test('affiche les informations de base du patient', () => {
    render(<PatientStatusCard {...defaultProps} />);

    // Utilisation de regex /.../i pour ignorer la casse
    expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    expect(screen.getByText(/#4002/i)).toBeInTheDocument();
    expect(screen.getByText(/icu-01/i)).toBeInTheDocument();
    expect(screen.getByText('115')).toBeInTheDocument();
  });

  test('affiche le bon message et style pour le statut CRITICAL', () => {
    const { container } = render(<PatientStatusCard {...defaultProps} status="Critical" />);

    // On cherche le texte de manière flexible (important à cause du CSS uppercase)
    expect(screen.getByText(/critical/i)).toBeInTheDocument();
    expect(screen.getByText(/immediate attention required/i)).toBeInTheDocument();

    // On récupère l'élément qui porte l'attribut data-status pour vérifier la bordure
    const cardElement = container.querySelector('[data-status="Critical"]');
    expect(cardElement).toHaveClass('border-t-destructive');
  });

  test('affiche le message correct pour le statut WARNING', () => {
    const { container } = render(<PatientStatusCard {...defaultProps} status="Warning" />);

    expect(screen.getByText(/warning/i)).toBeInTheDocument();
    expect(screen.getByText(/monitor patient closely/i)).toBeInTheDocument();
    
    const cardElement = container.querySelector('[data-status="Warning"]');
    expect(cardElement).toHaveClass('border-t-orange-500');
  });

  test('affiche les constantes vitales (NEWS2)', () => {
    render(<PatientStatusCard 
      {...defaultProps} 
      oxygenSaturation={95}
      temperature={38.2}
    />);

    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('38.2°')).toBeInTheDocument();
  });
});

