import { useState, useEffect } from "react";

interface Student {
  _id: string;
  name: string;
  studentId: string;
  email: string;
  dateOfBirth: string;
  course: string;
  enrollmentStatus: "Active" | "Graduated" | "Suspended" | "Withdrawn";
  gradeOrGpa: number;
  enrollmentDate: string;
  createdAt?: string;
}

interface Stats {
  totalCount: number;
  activeCount: number;
  graduatedCount: number;
  suspendedCount: number;
  withdrawnCount: number;
  avgGpa: number;
  courseDistribution: Array<{ _id: string; count: number }>;
}

export function Welcome() {
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and Sort states
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOption, setSortOption] = useState("created_desc");

  // Modal configuration
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formStudentId, setFormStudentId] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formDob, setFormDob] = useState("");
  const [formCourse, setFormCourse] = useState("Computer Science");
  const [formStatus, setFormStatus] = useState<Student["enrollmentStatus"]>("Active");
  const [formGpa, setFormGpa] = useState("4.00");
  const [formEnrollDate, setFormEnrollDate] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Notification Toast state
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const courses = [
    "Computer Science",
    "Information Technology",
    "Data Science",
    "Mechanical Engineering",
    "Business Administration"
  ];

  const triggerNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("https://student-management-system-0vjl.onrender.com/api/students/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to load statistics:", err);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);
      if (courseFilter) queryParams.append("course", courseFilter);
      if (statusFilter) queryParams.append("status", statusFilter);

      let sortQuery = "createdAt_desc";
      if (sortOption === "gpa_asc") sortQuery = "gpa_asc";
      else if (sortOption === "gpa_desc") sortQuery = "gpa_desc";
      else if (sortOption === "name_asc") sortQuery = "name_asc";
      else if (sortOption === "name_desc") sortQuery = "name_desc";
      else if (sortOption === "id_asc") sortQuery = "id_asc";
      else if (sortOption === "id_desc") sortQuery = "id_desc";

      queryParams.append("sort", sortQuery);

      const res = await fetch(`https://student-management-system-0vjl.onrender.com/api/students?${queryParams.toString()}`)
      if (!res.ok) {
        throw new Error("Could not retrieve student registers.");
      }
      const data = await res.json();
      setStudents(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching students list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchStats();
  }, [search, courseFilter, statusFilter, sortOption]);

  const openAddModal = () => {
    setModalMode("add");
    setSelectedStudent(null);
    setFormName("");
    setFormStudentId(`STU${Math.floor(100 + Math.random() * 900)}`);
    setFormEmail("");
    setFormDob(new Date(new Date().setFullYear(new Date().getFullYear() - 20)).toISOString().split("T")[0]); // Default to 20 years old
    setFormCourse("Computer Science");
    setFormStatus("Active");
    setFormGpa("3.50");
    setFormEnrollDate(new Date().toISOString().split("T")[0]); // Default to today
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setModalMode("edit");
    setSelectedStudent(student);
    setFormName(student.name);
    setFormStudentId(student.studentId);
    setFormEmail(student.email);
    setFormDob(student.dateOfBirth ? student.dateOfBirth.split("T")[0] : "");
    setFormCourse(student.course);
    setFormStatus(student.enrollmentStatus);
    setFormGpa(student.gradeOrGpa.toFixed(2));
    setFormEnrollDate(student.enrollmentDate ? student.enrollmentDate.split("T")[0] : "");
    setFormError(null);
    setIsModalOpen(true);
  };

  const openViewModal = (student: Student) => {
    setModalMode("view");
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const saveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Minor validation
    if (!formName.trim()) return setFormError("Student name is required.");
    if (!formStudentId.trim()) return setFormError("Student ID is required.");
    if (!formEmail.trim() || !formEmail.includes("@")) return setFormError("A valid email address is required.");
    if (!formDob) return setFormError("Date of birth is required.");
    if (!formEnrollDate) return setFormError("Enrollment date is required.");

    const parsedGpa = parseFloat(formGpa);
    if (isNaN(parsedGpa) || parsedGpa < 0 || parsedGpa > 4) {
      return setFormError("GPA must be a number between 0.0 and 4.0");
    }

    const payload = {
      name: formName.trim(),
      studentId: formStudentId.trim(),
      email: formEmail.trim(),
      dateOfBirth: formDob,
      course: formCourse,
      enrollmentStatus: formStatus,
      gradeOrGpa: parsedGpa,
      enrollmentDate: formEnrollDate,
    };

    try {
      const url = modalMode === "add" ? "https://student-management-system-0vjl.onrender.com/api/students" : `https://student-management-system-0vjl.onrender.com/api/students/${selectedStudent?._id}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        return setFormError(result.error || "Failed to save student details.");
      }

      setIsModalOpen(false);
      triggerNotification(
        modalMode === "add"
          ? `Successfully added "${formName}"`
          : `Successfully updated details of "${formName}"`
      );

      fetchStudents();
      fetchStats();
    } catch (err: any) {
      setFormError(err.message || "An exception occurred while sending the details.");
    }
  };

  const deleteStudent = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`https://student-management-system-0vjl.onrender.com/api/students/${id}`, { method: "DELETE", });
      if (res.ok) {
        triggerNotification(`Student "${name}" was deleted successfully.`);
        fetchStudents();
        fetchStats();
      } else {
        const errorData = await res.json();
        triggerNotification(errorData.error || "Failed to delete student.", "error");
      }
    } catch (err) {
      triggerNotification("Connection error. Could not delete student.", "error");
    }
  };

  // UI Status Badges helper
  const getStatusStyle = (status: Student["enrollmentStatus"]) => {
    switch (status) {
      case "Active":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
      case "Graduated":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20";
      case "Suspended":
        return "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20";
      case "Withdrawn":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Avatar initials helper
  const getInitialsSvg = (name: string) => {
    const splitArr = name.split(" ");
    const initials = splitArr.map(n => n[0]).slice(0, 2).join("").toUpperCase();

    // Select stable background gradient depending on length/letter code
    const colors = [
      "from-indigo-500 to-purple-600",
      "from-sky-500 to-blue-600",
      "from-emerald-500 to-teal-600",
      "from-amber-500 to-orange-600",
      "from-rose-500 to-pink-600"
    ];
    const index = initials.charCodeAt(0) % colors.length;
    return { initials, gradient: colors[index] };
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 font-sans transition-colors duration-200">

      {/* Toast Notification */}
      {notification && (
        <div className={`fixed right-6 top-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-xl transition-all duration-300 transform translate-y-0 ${notification.type === "success"
          ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/90 dark:border-emerald-800/40 dark:text-emerald-300"
          : "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/90 dark:border-rose-800/40 dark:text-rose-300"
          }`}>
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl text-white ${notification.type === "success" ? "bg-emerald-500" : "bg-rose-500"
            }`}>
            {notification.type === "success" ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm">System Update</p>
            <p className="text-xs opacity-90">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Sleek Dashboard Header */}
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-sky-550 to-indigo-600 bg-clip-text text-transparent dark:from-sky-400 dark:to-indigo-300">
                Nexus Academics
              </h1>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Institution Hub &bull; Live Academic Records Database
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 px-5 py-3 font-semibold text-white shadow-md hover:from-sky-600 hover:to-indigo-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950 transition-all duration-150"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Student
          </button>
        </header>

        {/* Stats Section with sleek layout */}
        {stats && (
          <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {/* Stat Card 1: Total */}
            <div className="group relative overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800/60 dark:bg-gray-900 transition-all duration-200 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700">
              <div className="absolute right-0 top-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-sky-500/5 group-hover:scale-110 transition-transform duration-200" />
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Enrolled</p>
                  <p className="text-2xl font-bold dark:text-white mt-0.5">{stats.totalCount}</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-gray-400 dark:text-gray-550 flex items-center gap-1">
                <span>All registered cohorts</span>
              </p>
            </div>

            {/* Stat Card 2: Active */}
            <div className="group relative overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800/60 dark:bg-gray-900 transition-all duration-200 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700">
              <div className="absolute right-0 top-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-emerald-500/5 group-hover:scale-110 transition-transform duration-200" />
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0y" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Students</p>
                  <p className="text-2xl font-bold dark:text-white mt-0.5">{stats.activeCount}</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {stats.totalCount > 0 ? `${Math.round((stats.activeCount / stats.totalCount) * 100)}% active rate` : "0% active rate"}
              </p>
            </div>

            {/* Stat Card 3: Graduated */}
            <div className="group relative overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800/60 dark:bg-gray-900 transition-all duration-200 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700">
              <div className="absolute right-0 top-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-indigo-500/5 group-hover:scale-110 transition-transform duration-200" />
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Alumni (Graduated)</p>
                  <p className="text-2xl font-bold dark:text-white mt-0.5">{stats.graduatedCount}</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-gray-400 dark:text-gray-550 flex items-center justify-between">
                <span>Active Alumni count</span>
                <span className="font-semibold text-gray-650 dark:text-gray-300">Suspended: {stats.suspendedCount}</span>
              </p>
            </div>

            {/* Stat Card 4: Average GPA */}
            <div className="group relative overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800/60 dark:bg-gray-900 transition-all duration-200 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700">
              <div className="absolute right-0 top-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-amber-500/5 group-hover:scale-110 transition-transform duration-200" />
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">GPA Average</p>
                  <p className="text-2xl font-bold dark:text-white mt-0.5">{stats.avgGpa.toFixed(2)}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5">
                <div className="h-1.5 flex-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-550"
                    style={{ width: `${(stats.avgGpa / 4.0) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">4.0 max</span>
              </div>
            </div>

          </section>
        )}

        {/* Charts & Analytics visual section */}
        {stats && stats.courseDistribution && stats.courseDistribution.length > 0 && (
          <section className="mb-8 overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800/60 dark:bg-gray-900">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.003 9.003 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              Course Enrollment Breakdown
            </h2>
            <div className="grid gap-6 md:grid-cols-2">

              {/* SVG Charts visual representation */}
              <div className="space-y-4">
                {stats.courseDistribution.map((courseItem) => {
                  const maxCode = Math.max(...stats.courseDistribution.map(c => c.count));
                  const percentage = maxCode > 0 ? (courseItem.count / maxCode) * 100 : 0;
                  return (
                    <div key={courseItem._id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{courseItem._id}</span>
                        <span className="text-gray-500 dark:text-gray-450 font-bold">{courseItem.count} {courseItem.count === 1 ? "student" : "students"}</span>
                      </div>
                      <div className="relative h-4 rounded-lg bg-gray-100 dark:bg-gray-800/80 overflow-hidden">
                        <div
                          className="h-full rounded-lg bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grid visual distribution summary */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-6 dark:border-gray-800/40 dark:bg-gray-900/30 flex flex-col justify-center">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Metrics Summary</h3>
                <p className="text-xs text-gray-550 dark:text-gray-400 mb-4 leading-relaxed">
                  nexus academics system is presently handling enrollments over <span className="font-semibold text-indigo-500">{stats.courseDistribution.length} majors</span>.
                  The average grade performance stands at a solid <span className="font-semibold text-emerald-500">{stats.avgGpa.toFixed(2)}</span> GPA.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-gray-200/50 bg-white p-3 dark:border-gray-850 dark:bg-gray-900">
                    <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-550">Top Active Cohort</p>
                    <p className="text-sm font-extrabold text-sky-600 dark:text-sky-450 truncate mt-0.5">
                      {stats.courseDistribution[0]?._id || "None"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200/50 bg-white p-3 dark:border-gray-850 dark:bg-gray-900">
                    <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-550">Unactive/Stopped</p>
                    <p className="text-sm font-extrabold text-rose-600 dark:text-rose-450 mt-0.5">
                      {stats.suspendedCount + stats.withdrawnCount} Students
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* Filters and List panel */}
        <section className="rounded-3xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800/60 dark:bg-gray-900 overflow-hidden">

          {/* Filtering bar section */}
          <div className="p-6 border-b border-gray-150 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-900/30 flex flex-col gap-4 lg:flex-row lg:items-center">

            {/* Search Input */}
            <div className="relative flex-1">
              <label htmlFor="search-students" className="sr-only">Search Students</label>
              <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="search-students"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search students by name, email, or database ID..."
                className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-850 dark:bg-gray-950 dark:focus:border-indigo-400"
              />
            </div>

            {/* Quick dropdown filters */}
            <div className="flex flex-wrap gap-3">

              {/* Course filter select */}
              <div className="flex flex-col">
                <label htmlFor="filter-course" className="sr-only">Filter by Course</label>
                <select
                  id="filter-course"
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:border-gray-855 dark:bg-gray-950 dark:focus:border-indigo-400"
                >
                  <option value="">All Courses</option>
                  {courses.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Status filter select */}
              <div className="flex flex-col">
                <label htmlFor="filter-status" className="sr-only">Filter by Status</label>
                <select
                  id="filter-status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:border-gray-855 dark:bg-gray-950 dark:focus:border-indigo-400"
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Graduated">Graduated</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Withdrawn">Withdrawn</option>
                </select>
              </div>

              {/* Sorter */}
              <div className="flex flex-col">
                <label htmlFor="sort-options" className="sr-only">Sort by</label>
                <select
                  id="sort-options"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:border-gray-855 dark:bg-gray-950 dark:focus:border-indigo-400"
                >
                  <option value="created_desc">Newest Added</option>
                  <option value="name_asc">Name (A-Z)</option>
                  <option value="name_desc">Name (Z-A)</option>
                  <option value="gpa_desc">Highest GPA</option>
                  <option value="gpa_asc">Lowest GPA</option>
                  <option value="id_asc">Student ID (Asc)</option>
                </select>
              </div>

            </div>
          </div>

          {/* Table list content */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-650 dark:border-gray-800 dark:border-t-indigo-400" />
              <p className="mt-4 text-sm font-semibold text-gray-500 dark:text-gray-400">Loading student records...</p>
            </div>
          ) : error ? (
            <div className="p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-950/20">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="mt-4 font-bold text-gray-800 dark:text-gray-200">Execution Error</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-440">{error}</p>
              <button
                onClick={fetchStudents}
                className="mt-6 px-4 py-2 border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-850 border-gray-300 dark:border-gray-800 font-semibold"
              >
                Retry
              </button>
            </div>
          ) : students.length === 0 ? (
            <div className="p-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-850/60 dark:text-gray-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-4 font-bold text-gray-800 dark:text-gray-200">No records found</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-450">We couldn't matching any registry logs matching your filters.</p>
              {(search || courseFilter || statusFilter) && (
                <button
                  onClick={() => { setSearch(""); setCourseFilter(""); setStatusFilter(""); }}
                  className="mt-6 text-sm font-semibold text-indigo-500 hover:text-indigo-650 hover:underline"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-150 uppercase text-[10px] font-bold text-gray-450 dark:bg-gray-900/50 dark:border-gray-850 dark:text-gray-500">
                    <th className="py-4 px-6">Student Info</th>
                    <th className="py-4 px-4">Student ID</th>
                    <th className="py-4 px-4">Subject Program</th>
                    <th className="py-4 px-4">GPA Score</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
                  {students.map((student) => {
                    const initialsData = getInitialsSvg(student.name);
                    return (
                      <tr key={student._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-all duration-100 group">

                        {/* Student Info */}
                        <td className="py-4.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr ${initialsData.gradient} text-white font-bold text-sm shadow-sm`}>
                              {initialsData.initials}
                            </div>
                            <div className="truncate">
                              <span
                                onClick={() => openViewModal(student)}
                                className="block font-bold text-gray-900 dark:text-white hover:text-indigo-500 dark:hover:text-indigo-400 cursor-pointer"
                              >
                                {student.name}
                              </span>
                              <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                                {student.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Student ID */}
                        <td className="py-4.5 px-4 font-mono text-xs font-semibold text-gray-600 dark:text-gray-400">
                          {student.studentId}
                        </td>

                        {/* Major / Program */}
                        <td className="py-4.5 px-4">
                          <span className="font-semibold text-sm text-gray-800 dark:text-gray-300">
                            {student.course}
                          </span>
                        </td>

                        {/* GPA */}
                        <td className="py-4.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              {student.gradeOrGpa.toFixed(2)}
                            </span>
                            <div className="h-1.5 w-12 rounded-full bg-gray-100 dark:bg-gray-805 hidden sm:block overflow-hidden">
                              <div
                                className={`h-full rounded-full ${student.gradeOrGpa >= 3.5
                                  ? "bg-emerald-500"
                                  : student.gradeOrGpa >= 3.0
                                    ? "bg-sky-500"
                                    : student.gradeOrGpa >= 2.0
                                      ? "bg-amber-500"
                                      : "bg-red-500"
                                  }`}
                                style={{ width: `${(student.gradeOrGpa / 4.0) * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Status badge */}
                        <td className="py-4.5 px-4">
                          <span className={`inline-flex items-center rounded-lg px-2 py-1 text-xs font-bold ${getStatusStyle(student.enrollmentStatus)}`}>
                            {student.enrollmentStatus}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">

                            <button
                              onClick={() => openViewModal(student)}
                              title="View details"
                              className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
                            >
                              <label className="sr-only">View Student details</label>
                              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>

                            <button
                              onClick={() => openEditModal(student)}
                              title="Edit registration"
                              className="p-2 text-gray-400 hover:text-indigo-650 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 rounded-xl transition"
                            >
                              <label className="sr-only">Edit Student registration</label>
                              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>

                            <button
                              onClick={() => deleteStudent(student._id, student.name)}
                              title="Delete record"
                              className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 rounded-xl transition"
                            >
                              <label className="sr-only">Delete Student record</label>
                              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </section>

      </div>

      {/* Slide-over or Modal Overlay design */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/50 backdrop-blur-xs transition-opacity duration-300">
          <div
            className="w-full max-w-lg overflow-hidden rounded-3xl border border-gray-250 bg-white shadow-2xl transition-all dark:border-gray-800 dark:bg-gray-900 transform scale-100"
            role="dialog"
            aria-modal="true"
          >

            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-gray-150 p-6 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
              <h3 className="text-xl font-bold dark:text-white">
                {modalMode === "add" && "Register New Student"}
                {modalMode === "edit" && "Update Student Details"}
                {modalMode === "view" && "Verify Academic File"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white transition"
              >
                <label className="sr-only">Close Modal</label>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal content */}
            {modalMode === "view" && selectedStudent ? (
              <div className="p-6 space-y-6">

                {/* Visual Avatar block */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-950 border border-gray-150 dark:border-gray-850">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr ${getInitialsSvg(selectedStudent.name).gradient} text-white font-bold text-2xl shadow-md`}>
                    {getInitialsSvg(selectedStudent.name).initials}
                  </div>
                  <div>
                    <h4 className="text-lg font-black dark:text-white">{selectedStudent.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-450">{selectedStudent.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Student Registration ID</p>
                    <p className="font-mono font-bold mt-1 text-gray-700 dark:text-gray-300">{selectedStudent.studentId}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Enrollment Status</p>
                    <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-bold mt-1.5 ${getStatusStyle(selectedStudent.enrollmentStatus)}`}>
                      {selectedStudent.enrollmentStatus}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Academic Major Course</p>
                    <p className="font-semibold text-gray-700 dark:text-gray-300 mt-1">{selectedStudent.course}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">GPA Grade Points</p>
                    <p className="font-extrabold text-indigo-500 dark:text-indigo-400 text-base mt-1">{selectedStudent.gradeOrGpa.toFixed(2)} / 4.00</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Date of Birth</p>
                    <p className="font-medium text-gray-700 dark:text-gray-305 mt-1">
                      {selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString(undefined, { dateStyle: "long" }) : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Initial Matriculate Date</p>
                    <p className="font-medium text-gray-700 dark:text-gray-305 mt-1">
                      {selectedStudent.enrollmentDate ? new Date(selectedStudent.enrollmentDate).toLocaleDateString(undefined, { dateStyle: "long" }) : "-"}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => openEditModal(selectedStudent)}
                    className="flex justify-center items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-850"
                  >
                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Modify Registry File
                  </button>
                </div>

              </div>
            ) : (
              <form onSubmit={saveStudent} className="p-6 space-y-4">

                {formError && (
                  <div className="bg-rose-50 text-rose-800 border border-rose-200 px-4 py-3 rounded-2xl text-sm dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-350">
                    <p className="font-semibold">Verification failure details</p>
                    <p className="text-xs mt-1 leading-relaxed">{formError}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="col-span-2 flex flex-col">
                    <label htmlFor="modal-name" className="text-xs font-bold text-gray-400 uppercase mb-1">Full Student Name</label>
                    <input
                      id="modal-name"
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Amanda Cole"
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-gray-800 dark:bg-gray-950 dark:focus:border-indigo-400"
                    />
                  </div>

                  {/* ID */}
                  <div className="flex flex-col">
                    <label htmlFor="modal-id" className="text-xs font-bold text-gray-400 uppercase mb-1">Student Database ID</label>
                    <input
                      id="modal-id"
                      type="text"
                      required
                      value={formStudentId}
                      onChange={(e) => setFormStudentId(e.target.value)}
                      placeholder="e.g. STU123"
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-gray-800 dark:bg-gray-950 dark:focus:border-indigo-400 font-mono"
                    />
                  </div>

                  {/* Email */}
                  <div className="flex flex-col">
                    <label htmlFor="modal-email" className="text-xs font-bold text-gray-400 uppercase mb-1">Email Address</label>
                    <input
                      id="modal-email"
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="e.g. amanda@edu.org"
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-gray-800 dark:bg-gray-950 dark:focus:border-indigo-400"
                    />
                  </div>

                  {/* Course select */}
                  <div className="flex flex-col">
                    <label htmlFor="modal-course" className="text-xs font-bold text-gray-400 uppercase mb-1">Academic Program Major</label>
                    <select
                      id="modal-course"
                      value={formCourse}
                      onChange={(e) => setFormCourse(e.target.value)}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-gray-800 dark:bg-gray-950 dark:focus:border-indigo-400"
                    >
                      {courses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* GPA */}
                  <div className="flex flex-col">
                    <label htmlFor="modal-gpa" className="text-xs font-bold text-gray-400 uppercase mb-1">GPA Index Score</label>
                    <input
                      id="modal-gpa"
                      type="number"
                      step="0.01"
                      min="0"
                      max="4"
                      required
                      value={formGpa}
                      onChange={(e) => setFormGpa(e.target.value)}
                      placeholder="4.00"
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-gray-800 dark:bg-gray-950 dark:focus:border-indigo-400"
                    />
                  </div>

                  {/* DOB */}
                  <div className="flex flex-col">
                    <label htmlFor="modal-dob" className="text-xs font-bold text-gray-400 uppercase mb-1">Date of Birth</label>
                    <input
                      id="modal-dob"
                      type="date"
                      required
                      value={formDob}
                      onChange={(e) => setFormDob(e.target.value)}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-gray-800 dark:bg-gray-950 dark:focus:border-indigo-400"
                    />
                  </div>

                  {/* Enrollment Date */}
                  <div className="flex flex-col">
                    <label htmlFor="modal-enrolldate" className="text-xs font-bold text-gray-400 uppercase mb-1">Enrollment Date</label>
                    <input
                      id="modal-enrolldate"
                      type="date"
                      required
                      value={formEnrollDate}
                      onChange={(e) => setFormEnrollDate(e.target.value)}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-gray-800 dark:bg-gray-950 dark:focus:border-indigo-400"
                    />
                  </div>

                  {/* Enrollment Status select */}
                  <div className="col-span-2 flex flex-col">
                    <label htmlFor="modal-status" className="text-xs font-bold text-gray-400 uppercase mb-1">Membership Status</label>
                    <select
                      id="modal-status"
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as Student["enrollmentStatus"])}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-gray-800 dark:bg-gray-950 dark:focus:border-indigo-400"
                    >
                      <option value="Active">Active</option>
                      <option value="Graduated">Graduated</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Withdrawn">Withdrawn</option>
                    </select>
                  </div>

                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-150 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-855"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-sky-650 hover:to-indigo-700 shadow-md"
                  >
                    {modalMode === "add" ? "Register Student" : "Save Changes"}
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
