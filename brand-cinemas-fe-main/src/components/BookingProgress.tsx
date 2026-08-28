interface BookingProgressProps {
  currentStep: 'selection' | 'snacks' | 'payment' | 'finish';
}

const steps = [
  { id: 'selection', title: 'SEATING OF CHOICE' },
  { id: 'snacks', title: 'SNACKS' },
  { id: 'payment', title: 'PAYMENT' },
  { id: 'finish', title: 'FINISH' },
];

export default function BookingProgress({ currentStep }: BookingProgressProps) {
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center gap-2">
          <div className={`flex items-center gap-2 rounded-full px-2 py-1 sm:px-3 ${
            index <= currentStepIndex ? 'bg-primary-600 text-gray-900 dark:text-white' : 'bg-gray-200 dark:bg-dark-800 text-gray-500 dark:text-slate-500'
          }`}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200/30 dark:bg-white/15 text-[11px] font-bold">
              {index + 1}
            </span>
            <span className="hidden text-xs font-bold sm:block">
              {step.title}
            </span>
          </div>
          {index < steps.length - 1 && (
            <span className={`hidden h-px w-8 sm:block ${index < currentStepIndex ? 'bg-primary-500' : 'bg-gray-300 dark:bg-dark-700'}`} />
          )}
        </div>
      ))}
    </div>
  );
}
