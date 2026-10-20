
import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  StatusBar,
} from "react-native";

const GREEN = "#176B45";

const initialBusinesses = [
  {
    id: "demo",
    name: "Il mio primo catalogo",
    type: "Negozio",
    slug: "il-mio-catalogo",
    description: "Benvenuti nel nostro catalogo digitale.",
    phone: "",
    whatsapp: "",
    categories: [
      {
        id: "cat1",
        name: "Prodotti",
        items: [
          {
            id: "p1",
            name: "Prodotto di esempio",
            description: "Descrizione del prodotto.",
            price: "12.00",
            visible: true,
            variants: [],
          },
        ],
      },
    ],
    published: false,
    showPrices: true,
    showAvailability: false,
    color: GREEN,
  },
];

const makeId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const initialPage = {
  dashboard: "dashboard",
  editor: "editor",
  preview: "preview",
  settings: "settings",
};

function Button({ title, onPress, secondary, small, disabled }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        secondary && styles.buttonSecondary,
        small && styles.buttonSmall,
        disabled && { opacity: 0.45 },
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          secondary && styles.buttonSecondaryText,
          small && { fontSize: 12 },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

function Field({ label, value, onChangeText, placeholder, multiline }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value == null ? "" : String(value)}
        onChangeText={onChangeText}
        placeholder={placeholder || ""}
        placeholderTextColor="#98A29B"
        multiline={multiline}
        style={[
          styles.input,
          multiline && styles.multilineInput,
        ]}
      />
    </View>
  );
}

export default function App() {
  const [businesses, setBusinesses] = useState(initialBusinesses);
  const [businessId, setBusinessId] = useState("demo");
  const [page, setPage] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [newBusinessName, setNewBusinessName] = useState("");
  const [newBusinessType, setNewBusinessType] = useState("Negozio");
  const [newCategory, setNewCategory] = useState("");
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [notice, setNotice] = useState("");

  const business = businesses.find((b) => b.id === businessId);

  const updateBusiness = (patch) => {
    setBusinesses((all) =>
      all.map((b) =>
        b.id === businessId ? { ...b, ...patch } : b
      )
    );
  };

  const updateCategory = (categoryId, patch) => {
    updateBusiness({
      categories: business.categories.map((c) =>
        c.id === categoryId ? { ...c, ...patch } : c
      ),
    });
  };

  const updateProduct = (categoryId, productId, patch) => {
    updateBusiness({
      categories: business.categories.map((category) =>
        category.id !== categoryId
          ? category
          : {
              ...category,
              items: category.items.map((item) =>
                item.id === productId
                  ? { ...item, ...patch }
                  : item
              ),
            }
      ),
    });
  };

  const filteredBusinesses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return businesses;
    return businesses.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.type.toLowerCase().includes(q)
    );
  }, [businesses, search]);

  const totalProducts = business
    ? business.categories.reduce(
        (sum, category) => sum + category.items.length,
        0
      )
    : 0;

  const addBusiness = () => {
    const name = newBusinessName.trim();
    if (!name) {
      setNotice("Inserisci il nome dell'attività.");
      return;
    }

    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const created = {
      id: makeId(),
      name,
      type: newBusinessType,
      slug: `${slug || "catalogo"}-${businesses.length + 1}`,
      description: "",
      phone: "",
      whatsapp: "",
      categories: [],
      published: false,
      showPrices: true,
      showAvailability: false,
      color: GREEN,
    };

    setBusinesses((all) => [...all, created]);
    setBusinessId(created.id);
    setNewBusinessName("");
    setPage("editor");
    setNotice("Attività creata. Ora puoi configurare il catalogo.");
  };

  const addCategory = () => {
    const name = newCategory.trim();
    if (!name) {
      setNotice("Inserisci il nome della categoria.");
      return;
    }

    const category = { id: makeId(), name, items: [] };
    updateBusiness({
      categories: [...business.categories, category],
    });
    setSelectedCategoryId(category.id);
    setNewCategory("");
    setNotice("Categoria aggiunta.");
  };

  const addProduct = () => {
    if (!selectedCategoryId) {
      setNotice("Seleziona prima una categoria.");
      return;
    }

    if (!newProduct.name.trim()) {
      setNotice("Inserisci il nome del prodotto.");
      return;
    }

    const category = business.categories.find(
      (c) => c.id === selectedCategoryId
    );

    if (!category) return;

    const product = {
      id: makeId(),
      name: newProduct.name.trim(),
      description: newProduct.description.trim(),
      price: newProduct.price.trim(),
      visible: true,
      variants: [],
    };

    updateCategory(category.id, {
      items: [...category.items, product],
    });

    setNewProduct({ name: "", description: "", price: "" });
    setNotice("Prodotto aggiunto.");
  };

  const removeProduct = (categoryId, productId) => {
    const category = business.categories.find(
      (c) => c.id === categoryId
    );
    if (!category) return;

    updateCategory(categoryId, {
      items: category.items.filter((p) => p.id !== productId),
    });
    setNotice("Prodotto rimosso.");
  };

  const addVariant = (categoryId, product) => {
    const name = "Variante " + (product.variants.length + 1);
    updateProduct(categoryId, product.id, {
      variants: [
        ...product.variants,
        { id: makeId(), name, price: product.price || "0.00" },
      ],
    });
    setNotice("Variante aggiunta. Puoi modificarne nome e prezzo.");
  };

  const updateVariant = (
    categoryId,
    product,
    variantId,
    patch
  ) => {
    updateProduct(categoryId, product.id, {
      variants: product.variants.map((v) =>
        v.id === variantId ? { ...v, ...patch } : v
      ),
    });
  };

  const removeVariant = (categoryId, product, variantId) => {
    updateProduct(categoryId, product.id, {
      variants: product.variants.filter((v) => v.id !== variantId),
    });
  };

  const publishBusiness = () => {
    if (business.categories.length === 0) {
      setNotice("Aggiungi almeno una categoria prima di pubblicare.");
      return;
    }

    updateBusiness({ published: true });
    setNotice(
      "Anteprima pubblicata nell'app. Per renderla accessibile online serve il deployment."
    );
  };

  const priceText = (price) => {
    if (price === "" || price == null) return "Prezzo su richiesta";
    return `${String(price).replace(".", ",")} €`;
  };

  const go = (next) => {
    setNotice("");
    setPage(next);
  };

  const header = (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.brand}
        onPress={() => go("dashboard")}
      >
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>M</Text>
        </View>
        <View>
          <Text style={styles.brandTitle}>MenuQR Pro</Text>
          <Text style={styles.brandSubtitle}>DIGITAL BUSINESS BUILDER</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.accountBadge}>
        <Text style={styles.accountBadgeText}>MQ</Text>
      </View>
    </View>
  );

  const navigation = (
    <View style={styles.nav}>
      {[
        ["dashboard", "Dashboard"],
        ["editor", "Editor"],
        ["preview", "Sito pubblico"],
        ["settings", "Impostazioni"],
      ].map(([key, label]) => (
        <TouchableOpacity
          key={key}
          onPress={() => go(key)}
          style={[styles.navItem, page === key && styles.navItemActive]}
        >
          <Text
            style={[
              styles.navText,
              page === key && styles.navTextActive,
            ]}
          >
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (!business) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text>Caricamento della piattaforma...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F8F6" />
      <View style={styles.app}>
        {header}
        {navigation}

        <ScrollView
          style={styles.main}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {notice !== "" && (
            <TouchableOpacity
              onPress={() => setNotice("")}
              style={styles.notice}
            >
              <Text style={styles.noticeText}>{notice}  ×</Text>
            </TouchableOpacity>
          )}

          {page === "dashboard" && (
            <>
              <Text style={styles.eyebrow}>IL TUO SPAZIO DI LAVORO</Text>
              <Text style={styles.pageTitle}>Dashboard</Text>
              <Text style={styles.muted}>
                Crea e gestisci siti, menu e cataloghi digitali.
              </Text>

              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {businesses.length}
                  </Text>
                  <Text style={styles.statLabel}>Attività</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {businesses.filter((b) => b.published).length}
                  </Text>
                  <Text style={styles.statLabel}>Pubblicazioni</Text>
                </View>
              </View>

              <View style={styles.panel}>
                <Text style={styles.sectionTitle}>
                  Crea una nuova attività
                </Text>
                <Text style={styles.muted}>
                  Ogni attività avrà il proprio catalogo e le proprie
                  impostazioni.
                </Text>

                <Field
                  label="Nome attività"
                  value={newBusinessName}
                  onChangeText={setNewBusinessName}
                  placeholder="Es. Vivaio Verde"
                />

                <Text style={styles.label}>Tipo di attività</Text>
                <View style={styles.choiceRow}>
                  {["Ristorante", "Negozio", "Vivaio", "Servizi"].map(
                    (type) => (
                      <TouchableOpacity
                        key={type}
                        onPress={() => setNewBusinessType(type)}
                        style={[
                          styles.choice,
                          newBusinessType === type && styles.choiceActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.choiceText,
                            newBusinessType === type &&
                              styles.choiceTextActive,
                          ]}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
                <Button title="+ Crea attività" onPress={addBusiness} />
              </View>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Le tue attività</Text>
              </View>

              <Field
                label="Cerca attività"
                value={search}
                onChangeText={setSearch}
                placeholder="Nome o tipologia..."
              />

              {filteredBusinesses.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  onPress={() => {
                    setBusinessId(b.id);
                    go("editor");
                  }}
                  style={styles.businessCard}
                >
                  <View style={styles.businessIcon}>
                    <Text style={styles.businessIconText}>
                      {b.type === "Ristorante"
                        ? "R"
                        : b.type === "Vivaio"
                        ? "V"
                        : "N"}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.businessName}>{b.name}</Text>
                    <Text style={styles.muted}>
                      {b.type} · {b.categories.length} categorie
                    </Text>
                    <Text style={styles.slug}>/{b.slug}</Text>
                  </View>
                  <Text
                    style={[
                      styles.status,
                      b.published ? styles.statusLive : styles.statusDraft,
                    ]}
                  >
                    {b.published ? "Pubblicato" : "Bozza"}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {page === "editor" && (
            <>
              <Text style={styles.eyebrow}>CREAZIONE SENZA CODICE</Text>
              <Text style={styles.pageTitle}>Editor del catalogo</Text>
              <Text style={styles.muted}>
                Modifica {business.name}. Le modifiche si riflettono
                nell'anteprima del sito.
              </Text>

              <View style={styles.panel}>
                <Text style={styles.sectionTitle}>Dati dell'attività</Text>
                <Field
                  label="Nome"
                  value={business.name}
                  onChangeText={(v) => updateBusiness({ name: v })}
                />
                <Field
                  label="Descrizione"
                  value={business.description}
                  onChangeText={(v) => updateBusiness({ description: v })}
                  multiline
                  placeholder="Descrivi la tua attività..."
                />
                <Field
                  label="Telefono"
                  value={business.phone}
                  onChangeText={(v) => updateBusiness({ phone: v })}
                  placeholder="Numero di telefono"
                />
                <Field
                  label="WhatsApp"
                  value={business.whatsapp}
                  onChangeText={(v) => updateBusiness({ whatsapp: v })}
                  placeholder="Numero con prefisso internazionale"
                />
                <Field
                  label="Indirizzo del sito (slug)"
                  value={business.slug}
                  onChangeText={(v) =>
                    updateBusiness({
                      slug: v.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                    })
                  }
                  placeholder="nome-attivita"
                />
              </View>

              <View style={styles.panel}>
                <Text style={styles.sectionTitle}>Aspetto del sito</Text>
                <Text style={styles.muted}>
                  Seleziona il colore principale.
                </Text>
                <View style={styles.colorRow}>
                  {[
                    "#176B45",
                    "#2457A7",
                    "#854D0E",
                    "#7E315A",
                    "#242424",
                  ].map((color) => (
                    <TouchableOpacity
                      key={color}
                      onPress={() => updateBusiness({ color })}
                      style={[
                        styles.colorDot,
                        { backgroundColor: color },
                        business.color === color && styles.colorSelected,
                      ]}
                    />
                  ))}
                </View>

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Mostra i prezzi</Text>
                  <Switch
                    value={business.showPrices}
                    onValueChange={(v) => updateBusiness({ showPrices: v })}
                    trackColor={{ true: GREEN, false: "#CDD4CE" }}
                  />
                </View>
                <View style={styles.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.switchLabel}>
                      Gestisci disponibilità
                    </Text>
                    <Text style={styles.muted}>
                      Campo opzionale per i prodotti.
                    </Text>
                  </View>
                  <Switch
                    value={business.showAvailability}
                    onValueChange={(v) =>
                      updateBusiness({ showAvailability: v })
                    }
                    trackColor={{ true: GREEN, false: "#CDD4CE" }}
                  />
                </View>
              </View>

              <View style={styles.panel}>
                <Text style={styles.sectionTitle}>Categorie</Text>
                <Field
                  label="Nuova categoria o sottocategoria"
                  value={newCategory}
                  onChangeText={setNewCategory}
                  placeholder="Es. Piante da interno"
                />
                <Button title="+ Aggiungi categoria" onPress={addCategory} />

                {business.categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => setSelectedCategoryId(category.id)}
                    style={[
                      styles.categoryRow,
                      selectedCategoryId === category.id &&
                        styles.categoryRowSelected,
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.categoryName}>
                        {category.name}
                      </Text>
                      <Text style={styles.muted}>
                        {category.items.length} prodotti
                      </Text>
                    </View>
                    {selectedCategoryId === category.id && (
                      <Text style={{ color: GREEN, fontWeight: "800" }}>
                        SELEZIONATA
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.panel}>
                <Text style={styles.sectionTitle}>Nuovo prodotto</Text>
                <Text style={styles.muted}>
                  {selectedCategoryId
                    ? `Categoria selezionata: ${
                        business.categories.find(
                          (c) => c.id === selectedCategoryId
                        )?.name || ""
                      }`
                    : "Seleziona prima una categoria."}
                </Text>

                <Field
                  label="Nome prodotto"
                  value={newProduct.name}
                  onChangeText={(v) =>
                    setNewProduct((p) => ({ ...p, name: v }))
                  }
                  placeholder="Nome del prodotto"
                />
                <Field
                  label="Descrizione"
                  value={newProduct.description}
                  onChangeText={(v) =>
                    setNewProduct((p) => ({ ...p, description: v }))
                  }
                  placeholder="Descrizione..."
                  multiline
                />
                <Field
                  label="Prezzo"
                  value={newProduct.price}
                  onChangeText={(v) =>
                    setNewProduct((p) => ({ ...p, price: v }))
                  }
                  placeholder="Es. 12.50"
                />
                <Button
                  title="+ Aggiungi prodotto"
                  onPress={addProduct}
                  disabled={!selectedCategoryId}
                />
              </View>

              {business.categories.map((category) => (
                <View key={category.id} style={styles.panel}>
                  <Text style={styles.sectionTitle}>{category.name}</Text>
                  {category.items.map((product) => (
                    <View key={product.id} style={styles.productEditor}>
                      <Field
                        label="Nome"
                        value={product.name}
                        onChangeText={(v) =>
                          updateProduct(category.id, product.id, { name: v })
                        }
                      />
                      <Field
                        label="Descrizione"
                        value={product.description}
                        onChangeText={(v) =>
                          updateProduct(category.id, product.id, {
                            description: v,
                          })
                        }
                      />
                      <Field
                        label="Prezzo"
                        value={product.price}
                        onChangeText={(v) =>
                          updateProduct(category.id, product.id, { price: v })
                        }
                      />

                      <View style={styles.switchRow}>
                        <Text style={styles.switchLabel}>
                          Visibile nel catalogo
                        </Text>
                        <Switch
                          value={product.visible}
                          onValueChange={(v) =>
                            updateProduct(category.id, product.id, {
                              visible: v,
                            })
                          }
                          trackColor={{ true: GREEN, false: "#CDD4CE" }}
                        />
                      </View>

                      {business.showAvailability && (
                        <Text style={styles.muted}>
                          Disponibilità: campo previsto; la gestione
                          persistente verrà collegata al database.
                        </Text>
                      )}

                      <Text style={styles.label}>Varianti</Text>
                      {product.variants.map((variant) => (
                        <View key={variant.id} style={styles.variantBox}>
                          <Field
                            label="Nome variante"
                            value={variant.name}
                            onChangeText={(v) =>
                              updateVariant(category.id, product, variant.id, {
                                name: v,
                              })
                            }
                          />
                          <Field
                            label="Prezzo variante"
                            value={variant.price}
                            onChangeText={(v) =>
                              updateVariant(category.id, product, variant.id, {
                                price: v,
                              })
                            }
                          />
                          <Button
                            title="Rimuovi variante"
                            secondary
                            small
                            onPress={() =>
                              removeVariant(category.id, product, variant.id)
                            }
                          />
                        </View>
                      ))}
                      <Button
                        title="+ Aggiungi variante"
                        secondary
                        small
                        onPress={() => addVariant(category.id, product)}
                      />
                      <Button
                        title="Elimina prodotto"
                        secondary
                        small
                        onPress={() => removeProduct(category.id, product.id)}
                      />
                    </View>
                  ))}
                </View>
              ))}

              <Button
                title="Visualizza anteprima"
                onPress={() => go("preview")}
              />
              <Button
                title="Pubblica catalogo"
                onPress={publishBusiness}
              />
            </>
          )}

          {page === "preview" && (
            <>
              <Text style={styles.eyebrow}>ANTEPRIMA CLIENTE</Text>
              <Text style={styles.pageTitle}>Sito pubblico</Text>
              <Text style={styles.muted}>
                Questa è l'anteprima del sito dell'attività selezionata.
              </Text>

              <View style={styles.publicSite}>
                <View
                  style={[
                    styles.publicHero,
                    { backgroundColor: business.color || GREEN },
                  ]}
                >
                  <Text style={styles.publicBrand}>MENUQR PRO</Text>
                  <Text style={styles.publicTitle}>{business.name}</Text>
                  <Text style={styles.publicDescription}>
                    {business.description || "Benvenuti nel nostro catalogo."}
                  </Text>
                </View>

                <View style={styles.publicContent}>
                  {business.categories.map((category) => {
                    const items = category.items.filter((p) => p.visible);
                    if (items.length === 0) return null;

                    return (
                      <View key={category.id}>
                        <Text style={styles.publicCategory}>
                          {category.name}
                        </Text>
                        {items.map((product) => (
                          <View
                            key={product.id}
                            style={styles.publicProduct}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={styles.publicProductName}>
                                {product.name}
                              </Text>
                              <Text style={styles.publicProductDescription}>
                                {product.description}
                              </Text>

                              {product.variants.map((variant) => (
                                <View
                                  key={variant.id}
                                  style={styles.publicVariant}
                                >
                                  <Text style={styles.publicVariantName}>
                                    {variant.name}
                                  </Text>
                                  {business.showPrices && (
                                    <Text style={styles.publicPrice}>
                                      {priceText(variant.price)}
                                    </Text>
                                  )}
                                </View>
                              ))}
                            </View>
                            {business.showPrices && (
                              <Text style={styles.publicPrice}>
                                {priceText(product.price)}
                              </Text>
                            )}
                          </View>
                        ))}
                      </View>
                    );
                  })}

                  {business.categories.every(
                    (c) => c.items.filter((p) => p.visible).length === 0
                  ) && (
                    <Text style={styles.muted}>
                      Nessun prodotto visibile al momento.
                    </Text>
                  )}

                  {!!business.phone && (
                    <Text style={styles.contactText}>
                      Telefono: {business.phone}
                    </Text>
                  )}
                  {!!business.whatsapp && (
                    <Text style={styles.contactText}>
                      WhatsApp: {business.whatsapp}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.panel}>
                <Text style={styles.sectionTitle}>Stato del sito</Text>
                <Text style={styles.muted}>
                  {business.published
                    ? "Anteprima contrassegnata come pubblicata."
                    : "Il sito è ancora in bozza."}
                </Text>
                <Text style={styles.muted}>
                  Indirizzo previsto: /{business.slug}
                </Text>
                <Button
                  title="Modifica catalogo"
                  onPress={() => go("editor")}
                />
                <Button
                  title="Pubblica"
                  onPress={publishBusiness}
                />
              </View>
            </>
          )}

          {page === "settings" && (
            <>
              <Text style={styles.eyebrow}>CONFIGURAZIONE</Text>
              <Text style={styles.pageTitle}>Impostazioni</Text>

              <View style={styles.panel}>
                <Text style={styles.sectionTitle}>Attività selezionata</Text>
                <Text style={styles.businessName}>{business.name}</Text>
                <Text style={styles.muted}>{business.type}</Text>

                <Text style={styles.label}>Cambia attività</Text>
                {businesses.map((b) => (
  <TouchableOpacity
    key={b.id}
    onPress={() => setBusinessId(b.id)}
    style={[
      styles.categoryRow,
      businessId === b.id && styles.categoryRowSelected,
    ]}
  >
    <Text style={styles.categoryName}>{b.name}</Text>
    {businessId === b.id && (
      <Text style={{ color: GREEN }}>Attiva</Text>
    )}
  </TouchableOpacity>
))}
              </View>

              <View style={styles.panel}>
                <Text style={styles.sectionTitle}>Funzioni della piattaforma</Text>
                {[
                  "Account e autenticazione",
                  "Database e backup",
                  "Caricamento immagini",
                  "Domini e pagine pubbliche",
                  "Generazione QR code",
                  "Abbonamenti e pagamenti",
                  "Statistiche di visita",
                ].map((item) => (
                  <View key={item} style={styles.featureRow}>
                    <Text style={styles.featureDot}>•</Text>
                    <Text style={styles.featureText}>{item}</Text>
                  </View>
                ))}
                <Text style={styles.muted}>
                  Queste integrazioni richiedono servizi backend e non sono
                  attivate da questa prima versione.
                </Text>
              </View>
            </>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerTitle}>MenuQR Pro</Text>
            <Text style={styles.muted}>
              Una piattaforma per creare esperienze digitali per ogni attività.
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F6F8F6" },
  app: { flex: 1, maxWidth: 1100, width: "100%", alignSelf: "center" },
  header: {
    minHeight: 76,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E6EBE7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 11 },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  brandMarkText: { color: "#FFFFFF", fontWeight: "900", fontSize: 24 },
  brandTitle: { fontSize: 17, fontWeight: "900", color: "#1D3527" },
  brandSubtitle: { fontSize: 8, letterSpacing: 1.4, color: "#738177", marginTop: 3 },
  accountBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E6F1E9",
    alignItems: "center",
    justifyContent: "center",
  },
  accountBadgeText: { fontWeight: "800", color: GREEN },
  nav: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E6EBE7",
  },
  navItem: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 9 },
  navItemActive: { backgroundColor: "#E6F1E9" },
  navText: { fontSize: 12, color: "#66736A", fontWeight: "600" },
  navTextActive: { color: GREEN, fontWeight: "800" },
  main: { flex: 1 },
  content: { padding: 20, paddingBottom: 50, gap: 12 },
  eyebrow: { fontSize: 10, letterSpacing: 2, color: GREEN, fontWeight: "900" },
  pageTitle: { fontSize: 29, color: "#20392A", fontWeight: "900", marginTop: 1 },
  muted: { fontSize: 12, lineHeight: 19, color: "#7B887F" },
  statsRow: { flexDirection: "row", gap: 12, marginVertical: 10 },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 17,
    borderWidth: 1,
    borderColor: "#E5EBE6",
  },
  statNumber: { fontSize: 27, fontWeight: "900", color: GREEN },
  statLabel: { fontSize: 12, color: "#738077", marginTop: 4 },
  panel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#E5EBE6",
    padding: 17,
    marginTop: 8,
    gap: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#263D2D" },
  sectionHeader: { marginTop: 12 },
  field: { gap: 6, marginTop: 5 },
  label: { fontSize: 12, color: "#4E5D52", fontWeight: "700" },
  input: {
    minHeight: 45,
    borderWidth: 1,
    borderColor: "#DDE5DE",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#20392A",
    fontSize: 14,
    backgroundColor: "#FFFFFF",
  },
  multilineInput: { minHeight: 90, textAlignVertical: "top" },
  button: {
    backgroundColor: GREEN,
    minHeight: 45,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginTop: 4,
  },
  buttonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
  buttonSecondary: { backgroundColor: "#EDF4EF", borderWidth: 1, borderColor: "#DCE8DF" },
  buttonSecondaryText: { color: GREEN },
  buttonSmall: { minHeight: 36, alignSelf: "flex-start", paddingVertical: 8 },
  choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginVertical: 4 },
  choice: { borderWidth: 1, borderColor: "#DDE5DE", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 9 },
  choiceActive: { backgroundColor: "#E6F1E9", borderColor: GREEN },
  choiceText: { color: "#647268", fontSize: 12, fontWeight: "600" },
  choiceTextActive: { color: GREEN, fontWeight: "800" },
  businessCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5EBE6",
    borderRadius: 15,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 5,
  },
  businessIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: "#E6F1E9",
    alignItems: "center",
    justifyContent: "center",
  },
  businessIconText: { fontSize: 18, color: GREEN, fontWeight: "900" },
  businessName: { fontSize: 15, fontWeight: "800", color: "#243B2A" },
  slug: { fontSize: 11, color: "#87938A", marginTop: 4 },
  status: { fontSize: 10, fontWeight: "800" },
  statusLive: { color: GREEN },
  statusDraft: { color: "#8C7B4E" },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E6EBE7",
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
  },
  categoryRowSelected: { borderColor: GREEN, backgroundColor: "#F0F7F2" },
  categoryName: { fontSize: 14, fontWeight: "700", color: "#304535" },
  colorRow: { flexDirection: "row", gap: 14, marginVertical: 7 },
  colorDot: { width: 35, height: 35, borderRadius: 18 },
  colorSelected: { borderWidth: 3, borderColor: "#B9D8C3" },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 7,
    borderTopWidth: 1,
    borderColor: "#EDF0ED",
  },
  switchLabel: { fontSize: 13, fontWeight: "700", color: "#344638" },
  productEditor: {
    borderTopWidth: 1,
    borderColor: "#E8EDE8",
    paddingTop: 12,
    marginTop: 8,
    gap: 7,
  },
  variantBox: {
    backgroundColor: "#F6F8F6",
    padding: 12,
    borderRadius: 11,
    gap: 8,
  },
  publicSite: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E3EAE4",
    borderRadius: 17,
    overflow: "hidden",
    marginTop: 8,
  },
  publicHero: { padding: 25, minHeight: 155, justifyContent: "center", gap: 8 },
  publicBrand: { color: "#D8E8DC", fontSize: 9, letterSpacing: 2, fontWeight: "900" },
  publicTitle: { color: "#FFFFFF", fontSize: 27, fontWeight: "900" },
  publicDescription: { color: "#FFFFFF", fontSize: 13, lineHeight: 20 },
  publicContent: { padding: 17, gap: 15 },
  publicCategory: {
    fontSize: 18,
    fontWeight: "900",
    color: "#273E2D",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: "#E6EBE7",
  },
  publicProduct: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#EDF0ED",
  },
  publicProductName: { fontSize: 15, fontWeight: "800", color: "#2A4030" },
  publicProductDescription: { fontSize: 12, lineHeight: 18, color: "#7A867D", marginTop: 4 },
  publicPrice: { fontSize: 13, fontWeight: "800", color: GREEN },
  publicVariant: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginTop: 8 },
  publicVariantName: { fontSize: 12, color: "#647168", flex: 1 },
  contactText: { color: GREEN, fontWeight: "700", fontSize: 13 },
  featureRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  featureDot: { fontSize: 20, color: GREEN },
  featureText: { fontSize: 13, color: "#445449" },
  notice: { backgroundColor: "#E7F3EA", padding: 12, borderRadius: 10 },
  noticeText: { color: "#205C37", fontSize: 12, lineHeight: 18 },
  footer: { paddingVertical: 22, alignItems: "center", gap: 5 },
  footerTitle: { fontSize: 14, fontWeight: "900", color: GREEN },
});
