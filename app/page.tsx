export default function Home() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Document System</h1>
        <p style={styles.text}>Welcome to the Document Management System.</p>

        <div style={styles.buttons}>
          <button style={styles.button}>Create Document</button>
          <button style={styles.button}>Track Document</button>
          <button style={styles.button}>Payroll</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f4f6f8",
  },
  card: {
    background: "white",
    padding: "40px",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    textAlign: "center",
    width: "350px",
  },
  title: {
    marginBottom: "10px",
  },
  text: {
    color: "#666",
    marginBottom: "20px",
  },
  buttons: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  button: {
    padding: "10px",
    border: "none",
    borderRadius: "5px",
    backgroundColor: "#2563eb",
    color: "white",
    cursor: "pointer",
  },
};
