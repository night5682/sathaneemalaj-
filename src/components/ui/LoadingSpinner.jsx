const LoadingSpinner = ({ size = 'md', color = 'primary' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const colorClasses = {
    primary: 'border-blue-600',
    white: 'border-white',
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div 
        className={`
          ${sizeClasses[size]} 
          ${colorClasses[color]}
          border-t-transparent rounded-full animate-spin
        `}
      />
    </div>
  );
};

export default LoadingSpinner;
