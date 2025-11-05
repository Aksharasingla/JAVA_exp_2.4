/*
Java - JDBC Examples
Contains:
  Part A: JDBCSelectEmployee.java    -- simple SELECT from Employee table
  Part B: ProductCRUD.java           -- menu-driven CRUD for Product table with transactions
  Part C: StudentMVC/StudentDAO.java -- MVC-style Student management using JDBC

IMPORTANT: Replace DB_URL, DB_USER, DB_PASSWORD with your MySQL connection details.
Also ensure the MySQL JDBC driver (Connector/J) is on the classpath when compiling/running.
Example (compile/run):
  javac *.java
  java JDBCSelectEmployee

SQL table examples (run in MySQL once):

-- Employee table for Part A
CREATE TABLE Employee (
  EmpID INT PRIMARY KEY,
  Name VARCHAR(100),
  Salary DOUBLE
);

-- Product table for Part B
CREATE TABLE Product (
  ProductID INT PRIMARY KEY AUTO_INCREMENT,
  ProductName VARCHAR(150),
  Price DOUBLE,
  Quantity INT
);

-- Student table for Part C
CREATE TABLE Student (
  StudentID INT PRIMARY KEY AUTO_INCREMENT,
  Name VARCHAR(150),
  Department VARCHAR(100),
  Marks DOUBLE
);
*/

// ===== Part A: JDBCSelectEmployee.java =====
import java.sql.*;

public class JDBCSelectEmployee {
    // TODO: set these for your environment
    private static final String DB_URL = "jdbc:mysql://localhost:3306/your_database";
    private static final String DB_USER = "root";
    private static final String DB_PASSWORD = "password";

    public static void main(String[] args) {
        String query = "SELECT EmpID, Name, Salary FROM Employee";

        // try-with-resources ensures closing
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(query)) {

            System.out.println("EmpID\tName\tSalary");
            while (rs.next()) {
                int id = rs.getInt("EmpID");
                String name = rs.getString("Name");
                double salary = rs.getDouble("Salary");
                System.out.printf("%d\t%s\t%.2f%n", id, name, salary);
            }

        } catch (SQLException e) {
            System.err.println("Database error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}


// ===== Part B: ProductCRUD.java =====
import java.sql.*;
import java.util.Scanner;

public class ProductCRUD {
    private static final String DB_URL = "jdbc:mysql://localhost:3306/your_database";
    private static final String DB_USER = "root";
    private static final String DB_PASSWORD = "password";

    private Connection conn;

    public ProductCRUD() throws SQLException {
        conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
        conn.setAutoCommit(true); // default; we'll toggle in transactional methods
    }

    public void close() throws SQLException {
        if (conn != null && !conn.isClosed()) conn.close();
    }

    public void createProduct(String name, double price, int qty) {
        String sql = "INSERT INTO Product(ProductName, Price, Quantity) VALUES (?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, name);
            ps.setDouble(2, price);
            ps.setInt(3, qty);
            ps.executeUpdate();
            System.out.println("Product inserted.");
        } catch (SQLException e) {
            System.err.println("Insert error: " + e.getMessage());
        }
    }

    public void readProducts() {
        String sql = "SELECT ProductID, ProductName, Price, Quantity FROM Product";
        try (Statement st = conn.createStatement(); ResultSet rs = st.executeQuery(sql)) {
            System.out.println("ID\tName\tPrice\tQty");
            while (rs.next()) {
                System.out.printf("%d\t%s\t%.2f\t%d%n",
                        rs.getInt("ProductID"),
                        rs.getString("ProductName"),
                        rs.getDouble("Price"),
                        rs.getInt("Quantity"));
            }
        } catch (SQLException e) {
            System.err.println("Read error: " + e.getMessage());
        }
    }

    public void updateProduct(int id, String newName, double newPrice, int newQty) {
        String sql = "UPDATE Product SET ProductName=?, Price=?, Quantity=? WHERE ProductID=?";
        boolean oldAuto = true;
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            // Begin transaction
            oldAuto = conn.getAutoCommit();
            conn.setAutoCommit(false);

            ps.setString(1, newName);
            ps.setDouble(2, newPrice);
            ps.setInt(3, newQty);
            ps.setInt(4, id);

            int affected = ps.executeUpdate();
            if (affected == 1) {
                conn.commit();
                System.out.println("Product updated and transaction committed.");
            } else {
                conn.rollback();
                System.out.println("No product updated. Transaction rolled back.");
            }
        } catch (SQLException e) {
            try { conn.rollback(); } catch (SQLException ex) { /* ignore */ }
            System.err.println("Update error, rolled back: " + e.getMessage());
        } finally {
            try { conn.setAutoCommit(oldAuto); } catch (SQLException ex) { /* ignore */ }
        }
    }

    public void deleteProduct(int id) {
        String sql = "DELETE FROM Product WHERE ProductID=?";
        boolean oldAuto = true;
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            oldAuto = conn.getAutoCommit();
            conn.setAutoCommit(false);

            ps.setInt(1, id);
            int affected = ps.executeUpdate();
            if (affected == 1) {
                conn.commit();
                System.out.println("Product deleted and transaction committed.");
            } else {
                conn.rollback();
                System.out.println("No product deleted. Transaction rolled back.");
            }
        } catch (SQLException e) {
            try { conn.rollback(); } catch (SQLException ex) { /* ignore */ }
            System.err.println("Delete error, rolled back: " + e.getMessage());
        } finally {
            try { conn.setAutoCommit(oldAuto); } catch (SQLException ex) { /* ignore */ }
        }
    }

    // Menu-driven interface for CLI
    public void runCLI() {
        Scanner sc = new Scanner(System.in);
        while (true) {
            System.out.println("\nProduct CRUD Menu:");
            System.out.println("1. Create product");
            System.out.println("2. Read all products");
            System.out.println("3. Update product");
            System.out.println("4. Delete product");
            System.out.println("5. Exit");
            System.out.print("Choice: ");
            String choice = sc.nextLine().trim();
            try {
                switch (choice) {
                    case "1":
                        System.out.print("Name: ");
                        String name = sc.nextLine();
                        System.out.print("Price: ");
                        double price = Double.parseDouble(sc.nextLine());
                        System.out.print("Quantity: ");
                        int qty = Integer.parseInt(sc.nextLine());
                        createProduct(name, price, qty);
                        break;
                    case "2": readProducts(); break;
                    case "3":
                        System.out.print("ProductID to update: ");
                        int uid = Integer.parseInt(sc.nextLine());
                        System.out.print("New name: ");
                        String nn = sc.nextLine();
                        System.out.print("New price: ");
                        double np = Double.parseDouble(sc.nextLine());
                        System.out.print("New qty: ");
                        int nq = Integer.parseInt(sc.nextLine());
                        updateProduct(uid, nn, np, nq);
                        break;
                    case "4":
                        System.out.print("ProductID to delete: ");
                        int did = Integer.parseInt(sc.nextLine());
                        deleteProduct(did);
                        break;
                    case "5":
                        sc.close();
                        System.out.println("Exiting Product Manager.");
                        return;
                    default: System.out.println("Invalid choice.");
                }
            } catch (NumberFormatException ne) {
                System.out.println("Invalid number input.");
            }
        }
    }

    public static void main(String[] args) {
        try {
            ProductCRUD manager = new ProductCRUD();
            manager.runCLI();
            manager.close();
        } catch (SQLException e) {
            System.err.println("Could not connect to DB: " + e.getMessage());
        }
    }
}


// ===== Part C: Student MVC (Student.java, StudentDAO.java, StudentView.java, StudentController.java) =====
// Student.java (Model)
class StudentModel {
    private int studentID;
    private String name;
    private String department;
    private double marks;

    public StudentModel() {}

    public StudentModel(int studentID, String name, String department, double marks) {
        this.studentID = studentID;
        this.name = name;
        this.department = department;
        this.marks = marks;
    }

    public StudentModel(String name, String department, double marks) {
        this.name = name; this.department = department; this.marks = marks;
    }

    // getters/setters
    public int getStudentID() { return studentID; }
    public void setStudentID(int studentID) { this.studentID = studentID; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public double getMarks() { return marks; }
    public void setMarks(double marks) { this.marks = marks; }

    @Override
    public String toString() {
        return String.format("ID:%d Name:%s Dept:%s Marks:%.2f", studentID, name, department, marks);
    }
}

// StudentDAO.java (Controller handling DB operations)
import java.util.*;

class StudentDAO {
    private static final String DB_URL = "jdbc:mysql://localhost:3306/your_database";
    private static final String DB_USER = "root";
    private static final String DB_PASSWORD = "password";

    private Connection conn;

    public StudentDAO() throws SQLException {
        conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
    }

    public void close() throws SQLException { if (conn != null) conn.close(); }

    public void addStudent(StudentModel s) throws SQLException {
        String sql = "INSERT INTO Student(Name, Department, Marks) VALUES (?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, s.getName());
            ps.setString(2, s.getDepartment());
            ps.setDouble(3, s.getMarks());
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) s.setStudentID(keys.getInt(1));
            }
        }
    }

    public List<StudentModel> getAllStudents() throws SQLException {
        List<StudentModel> list = new ArrayList<>();
        String sql = "SELECT StudentID, Name, Department, Marks FROM Student";
        try (Statement st = conn.createStatement(); ResultSet rs = st.executeQuery(sql)) {
            while (rs.next()) {
                list.add(new StudentModel(rs.getInt("StudentID"), rs.getString("Name"), rs.getString("Department"), rs.getDouble("Marks")));
            }
        }
        return list;
    }

    public boolean updateStudent(StudentModel s) throws SQLException {
        String sql = "UPDATE Student SET Name=?, Department=?, Marks=? WHERE StudentID=?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, s.getName());
            ps.setString(2, s.getDepartment());
            ps.setDouble(3, s.getMarks());
            ps.setInt(4, s.getStudentID());
            return ps.executeUpdate() == 1;
        }
    }

    public boolean deleteStudent(int id) throws SQLException {
        String sql = "DELETE FROM Student WHERE StudentID=?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            return ps.executeUpdate() == 1;
        }
    }
}

// StudentView.java (View)
class StudentView {
    private Scanner sc = new Scanner(System.in);

    public int showMenu() {
        System.out.println("\nStudent Management Menu:");
        System.out.println("1. Add student");
        System.out.println("2. View all students");
        System.out.println("3. Update student");
        System.out.println("4. Delete student");
        System.out.println("5. Exit");
        System.out.print("Choice: ");
        try { return Integer.parseInt(sc.nextLine().trim()); } catch (NumberFormatException e) { return -1; }
    }

    public StudentModel getStudentDetailsForAdd() {
        System.out.print("Name: ");
        String name = sc.nextLine();
        System.out.print("Department: ");
        String dept = sc.nextLine();
        System.out.print("Marks: ");
        double marks = Double.parseDouble(sc.nextLine());
        return new StudentModel(name, dept, marks);
    }

    public StudentModel getStudentDetailsForUpdate() {
        System.out.print("StudentID: ");
        int id = Integer.parseInt(sc.nextLine());
        System.out.print("Name: ");
        String name = sc.nextLine();
        System.out.print("Department: ");
        String dept = sc.nextLine();
        System.out.print("Marks: ");
        double marks = Double.parseDouble(sc.nextLine());
        return new StudentModel(id, name, dept, marks);
    }

    public int getStudentIDForDelete() {
        System.out.print("StudentID to delete: ");
        return Integer.parseInt(sc.nextLine());
    }

    public void showStudents(List<StudentModel> students) {
        System.out.println("--- Students ---");
        for (StudentModel s : students) System.out.println(s);
    }

    public void showMessage(String msg) { System.out.println(msg); }
}

// StudentController.java (ties DAO and View together)
public class StudentController {
    public static void main(String[] args) {
        StudentView view = new StudentView();
        StudentDAO dao = null;
        try {
            dao = new StudentDAO();
            while (true) {
                int choice = view.showMenu();
                switch (choice) {
                    case 1:
                        StudentModel toAdd = view.getStudentDetailsForAdd();
                        dao.addStudent(toAdd);
                        view.showMessage("Added student with ID: " + toAdd.getStudentID());
                        break;
                    case 2:
                        view.showStudents(dao.getAllStudents());
                        break;
                    case 3:
                        StudentModel toUpdate = view.getStudentDetailsForUpdate();
                        boolean ok = dao.updateStudent(toUpdate);
                        view.showMessage(ok ? "Updated." : "Update failed (ID not found).");
                        break;
                    case 4:
                        int delId = view.getStudentIDForDelete();
                        boolean delOk = dao.deleteStudent(delId);
                        view.showMessage(delOk ? "Deleted." : "Delete failed (ID not found)." );
                        break;
                    case 5:
                        view.showMessage("Exiting Student Manager.");
                        dao.close();
                        return;
                    default:
                        view.showMessage("Invalid choice.");
                }
            }
        } catch (SQLException e) {
            System.err.println("DB error: " + e.getMessage());
            e.printStackTrace();
        } catch (NumberFormatException nfe) {
            System.err.println("Invalid input: " + nfe.getMessage());
        } finally {
            if (dao != null) {
                try { dao.close(); } catch (SQLException e) { /* ignore */ }
            }
        }
    }
}
