import React, { useState, useEffect, useRef } from "react";
import { Home as HomeIcon, Coins, Package, TrendingUp, ArrowLeft, LogOut, User as UserIcon, Mail } from "lucide-react";
import { User, Sale, InventoryItem, Goal } from "./types";
import { SEED_USER, SEED_INVENTORY, SEED_SALES, SEED_GOAL } from "./data";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";
import { 
  testFirestoreConnection,
  getUserProfile,
  saveUserProfile,
  fetchSales,
  addSaleDocument,
  deleteSaleDocument,
  fetchInventory,
  addInventoryDocument,
  updateInventoryDocumentQty,
  fetchGoal,
  saveGoal,
  getEmailToUidMapping,
  saveEmailToUidMapping
} from "./lib/db";

// Sub-components
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import Progress from "./components/Progress";
import InventoryManager from "./components/InventoryManager";
import SalesHistory from "./components/SalesHistory";
import NewSaleModal from "./components/NewSaleModal";
import AdjustGoalModal from "./components/AdjustGoalModal";
import LockScreen from "./components/LockScreen";
import Profile from "./components/Profile";
import GmailCentral from "./components/GmailCentral";

export default function App() {
  const [activeTab, setActiveTab] = useState<"login" | "register" | "home" | "sales" | "inventory" | "progress" | "profile" | "gmail">("login");
  const [isLocked, setIsLocked] = useState(false);
  const isInitialAuthCheckRef = useRef(true);
  
  // State variables synchronized from localStorage, Firebase or Seed templates
  const [user, setUser] = useState<User | null>(null);
  const [dataOwnerUid, setDataOwnerUid] = useState<string | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [goal, setGoal] = useState<Goal>({ targetAmount: 15180, period: "Mensal" });

  // Loading state for Firebase
  const [loadingFirebase, setLoadingFirebase] = useState(true);

  // Firestore availability state
  const [isDbConnected, setIsDbConnected] = useState<boolean | null>(null);

  // Filter low stock configuration
  const [inventoryLowStockOnly, setInventoryLowStockOnly] = useState(false);

  // Modals state flags
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [isAdjustGoalOpen, setIsAdjustGoalOpen] = useState(false);

  // Initialize and synchronise state components on startup or auth change
  useEffect(() => {
    // If always require passcode is toggled or biometric is enabled, and session not unlocked yet:
    const requireLock = (localStorage.getItem("visu_always_require_password") === "true" || localStorage.getItem("visu_biometric_enabled") === "true");
    const isSessionUnlocked = sessionStorage.getItem("visu_session_unlocked") === "true";
    
    if (requireLock && !isSessionUnlocked) {
      setIsLocked(true);
    }

    // Check if we are connected on mount
    testFirestoreConnection().then((connected) => {
      setIsDbConnected(connected);
    });

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setLoadingFirebase(true);
      if (firebaseUser) {
        sessionStorage.setItem("visu_session_unlocked", "true");
        try {
          // Attempt to get or create safe email mapping to unified UID
          const userEmail = firebaseUser.email || "";
          let mappedUid = firebaseUser.uid;
          
          if (userEmail) {
            const safeEmail = userEmail.toLowerCase().trim().replace(/[^a-z0-9_]/g, "_");
            const existingUid = await getEmailToUidMapping(safeEmail);
            if (existingUid) {
              mappedUid = existingUid;
            } else {
              await saveEmailToUidMapping(safeEmail, firebaseUser.uid);
              mappedUid = firebaseUser.uid;
            }
          }
          
          setDataOwnerUid(mappedUid);

          // Attempt to load from firestore
          const profile = await getUserProfile(mappedUid);
          if (profile) {
            setUser(profile);
            
            // Sync rest of the data
            const dbSales = await fetchSales(mappedUid);
            const dbInventory = await fetchInventory(mappedUid);
            const dbGoal = await fetchGoal(mappedUid);
            
            setSales(dbSales);
            setInventory(dbInventory);
            if (dbGoal) {
              setGoal(dbGoal);
            }
            
            if (isInitialAuthCheckRef.current) {
              setActiveTab("login");
            } else {
              setActiveTab("home");
            }
          } else {
            // Newly logged-in user but no profile completed in db, go to register
            setUser({
              name: firebaseUser.displayName?.split(" ")[0] || "Usuário",
              storeName: "",
              category: "Artesanato",
              registered: false,
              email: firebaseUser.email || "",
            });
            // Clear simulated mock records so they aren't carried into or written to the real account
            setSales([]);
            setInventory([]);
            setGoal({ targetAmount: 15000, period: "Mensal" });
            if (isInitialAuthCheckRef.current) {
              setActiveTab("login");
            } else {
              setActiveTab("register");
            }
          }
        } catch (error) {
          console.error("Erro ao sincronizar dados do Firestore:", error);
        } finally {
          isInitialAuthCheckRef.current = false;
          setLoadingFirebase(false);
        }
      } else {
        // Fallback to local storage (Offline test mode / simulated login)
        isInitialAuthCheckRef.current = false;
        const savedUser = localStorage.getItem("visu_user");
        const savedSales = localStorage.getItem("visu_sales");
        const savedInventory = localStorage.getItem("visu_inventory");
        const savedGoal = localStorage.getItem("visu_goal");

        if (savedUser) {
          setUser(JSON.parse(savedUser));
          // Always land on the Login screen first rather than bypassing to the progress tab
          setActiveTab("login");
        } else {
          setUser(null);
          setActiveTab("login");
        }

        if (savedSales) {
          setSales(JSON.parse(savedSales));
        } else {
          setSales(SEED_SALES);
        }

        if (savedInventory) {
          setInventory(JSON.parse(savedInventory));
        } else {
          setInventory(SEED_INVENTORY);
        }

        if (savedGoal) {
          setGoal(JSON.parse(savedGoal));
        } else {
          setGoal(SEED_GOAL);
        }
        setLoadingFirebase(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Synchronise dark mode class configuration dynamically on active user preference shifts
  useEffect(() => {
    if (user?.darkModeEnabled) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [user?.darkModeEnabled]);

  // Save changes helper (Legacy localStorage fallback)
  const handleSaveState = (
    updatedUser: User | null,
    updatedSales: Sale[],
    updatedInventory: InventoryItem[],
    updatedGoal: Goal
  ) => {
    if (updatedUser) {
      localStorage.setItem("visu_user", JSON.stringify(updatedUser));
    } else {
      localStorage.removeItem("visu_user");
    }
    localStorage.setItem("visu_sales", JSON.stringify(updatedSales));
    localStorage.setItem("visu_inventory", JSON.stringify(updatedInventory));
    localStorage.setItem("visu_goal", JSON.stringify(updatedGoal));
  };

  // Login handler
  const handleLoginSuccess = async (email: string) => {
    sessionStorage.setItem("visu_session_unlocked", "true");
    
    // Explicitly set initial check to false on user login interaction to avoid any background race resetting screen to 'login'
    isInitialAuthCheckRef.current = false;
    
    if (auth.currentUser) {
      setLoadingFirebase(true);
      try {
        let activeUid = auth.currentUser.uid;
        const userEmail = auth.currentUser.email || "";
        if (userEmail) {
          const safeEmail = userEmail.toLowerCase().trim().replace(/[^a-z0-9_]/g, "_");
          const existingUid = await getEmailToUidMapping(safeEmail);
          if (existingUid) {
            activeUid = existingUid;
          } else {
            await saveEmailToUidMapping(safeEmail, auth.currentUser.uid);
          }
        }
        setDataOwnerUid(activeUid);
        
        const profile = await getUserProfile(activeUid);
        if (profile) {
          setUser(profile);
          
          // Clear any state from a previous/stale account to load fresh mapped records
          const dbSales = await fetchSales(activeUid);
          const dbInventory = await fetchInventory(activeUid);
          const dbGoal = await fetchGoal(activeUid);
          
          setSales(dbSales);
          setInventory(dbInventory);
          if (dbGoal) {
            setGoal(dbGoal);
          }
          
          setActiveTab("home");
        } else {
          // New account, redirect to registration
          setUser({
            name: auth.currentUser.displayName?.split(" ")[0] || "Usuário",
            storeName: "",
            category: "Artesanato",
            registered: false,
            email: auth.currentUser.email || "",
          });
          setSales([]);
          setInventory([]);
          setGoal({ targetAmount: 15000, period: "Mensal" });
          setActiveTab("register");
        }
      } catch (err) {
        console.error("Erro ao redirecionar após login:", err);
        // Fallback to register
        setActiveTab("register");
      } finally {
        setLoadingFirebase(false);
      }
      return; 
    }
    
    // Fallback: local demo mock login success
    const defaultUser = user || SEED_USER;
    const finalUser = { ...defaultUser, email, registered: true };
    setUser(finalUser);
    handleSaveState(finalUser, sales, inventory, goal);
    setActiveTab("home");
  };

  // Register completion handler
  const handleRegisterComplete = async (newUser: User, initialGoal?: Goal, initialItem?: InventoryItem) => {
    setUser(newUser);
    
    let updatedGoal = goal;
    if (initialGoal) {
      updatedGoal = initialGoal;
      setGoal(initialGoal);
    }

    // Force a 100% clean state, free of examples or mock data (limpo/zerado)
    const updatedInventory: InventoryItem[] = initialItem ? [initialItem] : [];
    const updatedSales: Sale[] = [];
    
    setInventory(updatedInventory);
    setSales(updatedSales);

    // Live Firebase persistence if user is logged in
    const activeUid = dataOwnerUid || auth.currentUser?.uid;
    if (auth.currentUser && activeUid) {
      setLoadingFirebase(true);
      try {
        // Build email mapping for account recovery persistence
        const userEmail = auth.currentUser.email || newUser.email || "";
        if (userEmail) {
          const safeEmail = userEmail.toLowerCase().trim().replace(/[^a-z0-9_]/g, "_");
          await saveEmailToUidMapping(safeEmail, activeUid);
          setDataOwnerUid(activeUid);
        }

        await saveUserProfile(activeUid, newUser);
        if (initialGoal) {
          await saveGoal(activeUid, initialGoal);
        }
        if (initialItem) {
          await addInventoryDocument(activeUid, initialItem);
        }
      } catch (err) {
        console.error("Falha ao salvar cadastro no Firestore:", err);
      } finally {
        setLoadingFirebase(false);
      }
    } else {
      // Offline fallback
      handleSaveState(newUser, updatedSales, updatedInventory, updatedGoal);
    }

    setActiveTab("home");
  };

  const handleLogout = async () => {
    // Firebase auth logout
    if (auth.currentUser) {
      setLoadingFirebase(true);
      try {
        await signOut(auth);
      } catch (err) {
        console.error("Erro ao deslogar:", err);
      } finally {
        setLoadingFirebase(false);
      }
    }
    
    setUser(null);
    localStorage.removeItem("visu_user");
    setActiveTab("login");
  };

  // Add Sale handler, deducting quantities
  const handleAddSale = async (newSale: Sale) => {
    const updatedSales = [newSale, ...sales];
    setSales(updatedSales);

    // Deduct stock item quantity
    const updatedInventory = inventory.map((item) => {
      if (item.name === newSale.itemDescription) {
        return {
          ...item,
          quantity: item.quantity - newSale.quantity
        };
      }
      return item;
    });
    setInventory(updatedInventory);

    // Live Firebase persistence
    const activeUid = dataOwnerUid || auth.currentUser?.uid;
    if (auth.currentUser && activeUid) {
      try {
        await addSaleDocument(activeUid, newSale);
        
        // Find corresponding product item and update in db
        const matchingItem = inventory.find(i => i.name === newSale.itemDescription);
        if (matchingItem) {
          await updateInventoryDocumentQty(activeUid, matchingItem.id, matchingItem.quantity - newSale.quantity);
        }
      } catch (err) {
        console.error("Falha ao salvar venda no Firestore:", err);
      }
    } else {
      // Local demo persistence fallback
      handleSaveState(user, updatedSales, updatedInventory, goal);
    }
    
    setActiveTab("sales");
  };

  // Remove Sale ledger entry
  const handleRemoveSale = async (id: string) => {
    const removedSale = sales.find((s) => s.id === id);
    const updatedSales = sales.filter((s) => s.id !== id);
    setSales(updatedSales);

    let updatedInventory = inventory;
    if (removedSale) {
      updatedInventory = inventory.map((item) => {
        if (item.name === removedSale.itemDescription) {
          return {
            ...item,
            quantity: item.quantity + removedSale.quantity
          };
        }
        return item;
      });
      setInventory(updatedInventory);
    }

    // Live Firebase sync
    const activeUid = dataOwnerUid || auth.currentUser?.uid;
    if (auth.currentUser && activeUid) {
      try {
        await deleteSaleDocument(activeUid, id);
        
        if (removedSale) {
          const matchingItem = inventory.find(i => i.name === removedSale.itemDescription);
          if (matchingItem) {
            await updateInventoryDocumentQty(activeUid, matchingItem.id, matchingItem.quantity + removedSale.quantity);
          }
        }
      } catch (err) {
        console.error("Erro ao deletar venda no Firestore:", err);
      }
    } else {
      handleSaveState(user, updatedSales, updatedInventory, goal);
    }
  };

  // Update Inventory item quantity directly
  const handleUpdateItemQty = async (id: string, newQty: number) => {
    const updatedInventory = inventory.map((item) => {
      if (item.id === id) {
        return { ...item, quantity: newQty };
      }
      return item;
    });
    setInventory(updatedInventory);

    // Live Firebase sync
    const activeUid = dataOwnerUid || auth.currentUser?.uid;
    if (auth.currentUser && activeUid) {
      try {
        await updateInventoryDocumentQty(activeUid, id, newQty);
      } catch (err) {
        console.error("Erro ao atualizar estoque no Firestore:", err);
      }
    } else {
      handleSaveState(user, sales, updatedInventory, goal);
    }
  };

  // Add new Custom Product to Catalog catalogue
  const handleAddInventoryProduct = async (newItem: InventoryItem) => {
    const updatedInventory = [newItem, ...inventory];
    setInventory(updatedInventory);

    // Live Firebase sync
    const activeUid = dataOwnerUid || auth.currentUser?.uid;
    if (auth.currentUser && activeUid) {
      try {
        await addInventoryDocument(activeUid, newItem);
      } catch (err) {
        console.error("Erro ao adicionar produto no Firestore:", err);
      }
    } else {
      handleSaveState(user, sales, updatedInventory, goal);
    }
  };

  // Goal adjustment
  const handleUpdateGoal = async (newTarget: number) => {
    const updatedGoal = { ...goal, targetAmount: newTarget };
    setGoal(updatedGoal);

    // Live Firebase sync
    const activeUid = dataOwnerUid || auth.currentUser?.uid;
    if (auth.currentUser && activeUid) {
      try {
        await saveGoal(activeUid, updatedGoal);
      } catch (err) {
        console.error("Erro ao atualizar meta no Firestore:", err);
      }
    } else {
      handleSaveState(user, sales, inventory, updatedGoal);
    }
  };

  const handleGoToLowStockInventory = () => {
    setInventoryLowStockOnly(true);
    setActiveTab("inventory");
  };

  // Loading Screen for Auth & Database State syncing
  if (loadingFirebase) {
    return (
      <div className="min-h-screen bg-[#f9f9f9] dark:bg-zinc-950 flex flex-col items-center justify-center p-4 select-none">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
          <h2 className="font-display font-black text-xl uppercase tracking-widest text-brand-primary dark:text-brand-yellow">
            Sincronizando Visu...
          </h2>
          <p className="font-sans text-brand-muted dark:text-zinc-400 text-sm font-medium">
            Buscando dados seguros no Firebase Cloud.
          </p>
        </div>
      </div>
    );
  }

  // Show secure LockScreen overlay if app is locally locked
  if (isLocked && user && activeTab !== "login" && activeTab !== "register") {
    return (
      <LockScreen
        onUnlock={() => setIsLocked(false)}
        userEmail={user.email || "usuario@visu.com"}
        storeName={user.storeName || "Minha Loja"}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] dark:bg-zinc-950 text-brand-dark dark:text-zinc-100 flex flex-col antialiased">
      
      {isDbConnected === false && (
        <div id="offline-banner" className="bg-amber-500 text-neutral-900 px-4 py-2 text-center text-xs font-black uppercase md:tracking-wide border-b-2 border-brand-dark flex flex-wrap items-center justify-center gap-2 select-none z-50">
          <span className="flex items-center gap-1">
            ⚠️ Modo de Contingência Local Ativo (Instância Firebase Offline ou Indisponível)
          </span>
          <button 
            id="reconnect-db-btn"
            onClick={async () => {
              const res = await testFirestoreConnection();
              setIsDbConnected(res);
            }} 
            className="underline ml-2 bg-neutral-900 text-amber-500 px-2.5 py-1 rounded font-display text-[10px] font-black uppercase hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Tentar Reconectar
          </button>
        </div>
      )}
      
      {/* Header element bar (shows on auth screens only and navigation viewports) */}
      {user && activeTab !== "login" && activeTab !== "register" && (
        <header className="sticky top-0 z-40 w-full bg-[#f9f9f9] dark:bg-zinc-900 border-b-2 border-brand-dark dark:border-zinc-800 flex justify-between items-center px-4 md:px-8 h-14 select-none">
          <div className="flex items-center gap-2">
            {activeTab !== "home" && (
              <button
                onClick={() => setActiveTab("home")}
                className="flex items-center justify-center p-2 rounded-lg hover:bg-brand-gray border border-transparent hover:border-brand-dark cursor-pointer text-brand-primary active:translate-y-0.5"
                title="Voltar para Início"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="font-display font-extrabold text-brand-primary text-xl md:text-2xl uppercase tracking-wider">
              Visu
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-1.5 border-2 border-brand-dark px-3 h-9 rounded-lg font-display text-xs font-black uppercase tracking-wide cursor-pointer shadow-[2px_2px_0px_0px_rgba(26,28,28,1)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all ${
                activeTab === "profile"
                  ? "bg-brand-orange text-brand-dark"
                  : "bg-brand-yellow/15 dark:bg-zinc-800 dark:text-zinc-200 hover:bg-brand-yellow/30"
              }`}
              title="Acessar Meu Perfil"
            >
              <UserIcon className="w-4 h-4 text-brand-primary dark:text-brand-yellow" />
              <span>{user.name || user.storeName || "Perfil"}</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-9 h-9 border-2 border-brand-dark dark:border-zinc-700 hover:bg-red-50 dark:hover:bg-zinc-850 text-[#ba1a1a] rounded-lg flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all"
              title="Sair da Conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>
      )}

      {/* Main Container Core Viewports router router */}
      <main className={`flex-1 flex flex-col justify-center w-full max-w-7xl mx-auto px-4 md:px-8 py-6 ${activeTab !== 'login' && activeTab !== 'register' ? 'pb-28' : ''}`}>
        
        {activeTab === "login" && (
          <Login
            onLoginSuccess={handleLoginSuccess}
            onGoToRegister={() => setActiveTab("register")}
            currentUser={user}
            onProceedToHome={() => setActiveTab("home")}
            onLogout={handleLogout}
          />
        )}

        {activeTab === "register" && (
          <Register
            onRegisterComplete={handleRegisterComplete}
            onGoBack={() => setActiveTab("login")}
          />
        )}

        {user && activeTab === "home" && (
          <Dashboard
            user={user}
            sales={sales}
            inventory={inventory}
            goal={goal}
            onOpenNewSale={() => setIsNewSaleOpen(true)}
            onChangeTab={(tab: any) => setActiveTab(tab)}
            onFilterLowStock={handleGoToLowStockInventory}
            onLockApp={() => {
              sessionStorage.removeItem("visu_session_unlocked");
              setIsLocked(true);
            }}
          />
        )}

        {user && activeTab === "sales" && (
          <SalesHistory
            sales={sales}
            onRemoveSale={handleRemoveSale}
          />
        )}

        {user && activeTab === "inventory" && (
          <InventoryManager
            inventory={inventory}
            onUpdateQuantity={handleUpdateItemQty}
            onAddItem={handleAddInventoryProduct}
            initialFilterLowStock={inventoryLowStockOnly}
            onClearLowStockFilter={() => setInventoryLowStockOnly(false)}
          />
        )}

        {user && activeTab === "progress" && (
          <Progress
            sales={sales}
            goal={goal}
            onOpenAdjustGoal={() => setIsAdjustGoalOpen(true)}
          />
        )}

        {user && activeTab === "profile" && (
          <Profile
            user={user}
            onUpdateUser={(updated) => setUser(updated)}
            onGoBack={() => setActiveTab("home")}
            dataOwnerUid={dataOwnerUid}
          />
        )}

        {user && activeTab === "gmail" && (
          <GmailCentral
            user={user}
            sales={sales}
            inventory={inventory}
          />
        )}
      </main>

      {/* Bottom Sticky Interactive Floating Navigation Bar */}
      {user && activeTab !== "login" && activeTab !== "register" && (
        <nav className="fixed bottom-0 left-0 w-full h-[72px] flex justify-around items-center px-4 bg-[#f9f9f9] dark:bg-zinc-900 border-t-2 border-brand-dark dark:border-zinc-800 z-40 select-none">
          {/* Goal progress tab (Progresso) - FIRST OPTION */}
          <button
            onClick={() => setActiveTab("progress")}
            className={`flex flex-col items-center justify-center cursor-pointer transition-all ${
              activeTab === "progress"
                ? "bg-[#fd8b00] text-brand-dark rounded-xl px-4 py-1 border-2 border-brand-dark shadow-[3px_3px_0px_0px_rgba(255,215,0,1)] -translate-y-1 font-bold font-display"
                : "text-brand-muted dark:text-zinc-300 hover:opacity-100 opacity-70 p-2 rounded-lg"
            }`}
          >
            <TrendingUp className="w-5 h-5 mb-0.5" />
            <span className="font-sans font-bold text-xs">Progresso</span>
          </button>

          {/* Home Tab (Visu Dashboard) - SECOND OPTION */}
          <button
            onClick={() => {
              setInventoryLowStockOnly(false);
              setActiveTab("home");
            }}
            className={`flex flex-col items-center justify-center cursor-pointer transition-all ${
              activeTab === "home"
                ? "bg-brand-yellow text-brand-dark rounded-xl px-4 py-1 border-2 border-brand-dark shadow-[3px_3px_0px_0px_rgba(253,139,0,1)] -translate-y-1 font-bold font-display"
                : "text-brand-muted dark:text-zinc-300 hover:opacity-100 opacity-70 p-2 rounded-lg"
            }`}
          >
            <HomeIcon className="w-5 h-5 mb-0.5" />
            <span className="font-sans font-bold text-xs">Visu</span>
          </button>

          {/* Sales ledger tab (Vendas) - THIRD OPTION */}
          <button
            onClick={() => setActiveTab("sales")}
            className={`flex flex-col items-center justify-center cursor-pointer transition-all ${
              activeTab === "sales"
                ? "bg-[#fd8b00] text-brand-dark rounded-xl px-4 py-1 border-2 border-brand-dark shadow-[3px_3px_0px_0px_rgba(255,215,0,1)] -translate-y-1 font-bold font-display"
                : "text-brand-muted dark:text-zinc-300 hover:opacity-100 opacity-70 p-2 rounded-lg"
            }`}
          >
            <Coins className="w-5 h-5 mb-0.5" />
            <span className="font-sans font-bold text-xs">Vendas</span>
          </button>

          {/* Catalog inventory tab (Estoque) - FOURTH OPTION */}
          <button
            onClick={() => {
              setInventoryLowStockOnly(false);
              setActiveTab("inventory");
            }}
            className={`flex flex-col items-center justify-center cursor-pointer transition-all ${
              activeTab === "inventory"
                ? "bg-brand-yellow text-brand-dark rounded-xl px-4 py-1 border-2 border-brand-dark shadow-[3px_3px_0px_0px_rgba(253,139,0,1)] -translate-y-1 font-bold font-display"
                : "text-brand-muted dark:text-zinc-300 hover:opacity-100 opacity-70 p-2 rounded-lg"
            }`}
          >
            <Package className="w-5 h-5 mb-0.5" />
            <span className="font-sans font-bold text-xs">Estoque</span>
          </button>

          {/* Gmail Central Tab - FIFTH OPTION */}
          <button
            onClick={() => {
              setActiveTab("gmail");
            }}
            className={`flex flex-col items-center justify-center cursor-pointer transition-all ${
              activeTab === "gmail"
                ? "bg-[#fd8b00] text-brand-dark rounded-xl px-4 py-1 border-2 border-brand-dark shadow-[3px_3px_0px_0px_rgba(255,215,0,1)] -translate-y-1 font-bold font-display"
                : "text-brand-muted dark:text-zinc-300 hover:opacity-100 opacity-70 p-2 rounded-lg"
            }`}
          >
            <Mail className="w-5 h-5 mb-0.5" />
            <span className="font-sans font-bold text-xs">Gmail</span>
          </button>
        </nav>
      )}

      {/* Registrar Sale overlays */}
      {user && (
        <NewSaleModal
          inventory={inventory}
          isOpen={isNewSaleOpen}
          onClose={() => setIsNewSaleOpen(false)}
          onAddSale={handleAddSale}
        />
      )}

      {/* Adjust goal overlays */}
      {user && (
        <AdjustGoalModal
          goal={goal}
          isOpen={isAdjustGoalOpen}
          onClose={() => setIsAdjustGoalOpen(false)}
          onUpdateGoal={handleUpdateGoal}
        />
      )}
    </div>
  );
}
