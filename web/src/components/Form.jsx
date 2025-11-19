import './Form.css';

const Form = ({ children, onSubmit, className = '', ...props }) => {
  return (
    <form 
      onSubmit={onSubmit} 
      className={`form ${className}`}
      {...props}
    >
      {children}
    </form>
  );
};

export default Form;