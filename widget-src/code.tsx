const { widget } = figma;
const {
  AutoLayout,
  Input,
  Rectangle,
  SVG,
  Text,
  useEffect,
  useSyncedState,
  useSyncedMap,
  usePropertyMenu,
} = widget;

// Level colors for connection dots (from style guide)
const levelColors = {
  primary: "#4A90E2",    // Blue
  secondary: "#9B59B6",  // Purple
  tertiary: "#F39C12",   // Orange
};

// Card background colors (from style guide)
const colors: string[] = ["#FFFFFF", "#BDE3FF", "#AFF4C6", "#FFE8A3", "#FFA198"];
const colorNames: string[] = ["White", "Blue", "Green", "Yellow", "Coral"];

interface NavItem {
  id: string;
  label: string;  // Nav label
  pageTitle: string;  // Page title
  url: string;  // URL
  level: "primary" | "secondary" | "tertiary";
  parentId: string | null;
  collapsed: boolean;
}

function WebsiteNavigation() {
  const [initialized, setInitialized] = useSyncedState<boolean>("initialized", false);
  const [hostname, setHostname] = useSyncedState("hostname", "");
  const [itemIds, setItemIds] = useSyncedState<string[]>("itemIds", []);
  const [selectedId, setSelectedId] = useSyncedState<string | null>("selectedId", null);
  const [cardColor, setCardColor] = useSyncedState("cardColor", colors[0]);
  const items = useSyncedMap<NavItem>("items");

  // Generate random ID
  function generateId(): string {
    return ("00000" + Math.floor(Math.random() * 1_000_000).toString()).slice(-6);
  }

  // Initialize with default item
  useEffect(() => {
    if (!initialized) {
      const defaultId = "000001";
      const defaultItem: NavItem = {
        id: defaultId,
        label: "Home",
        pageTitle: "",
        url: "/",
        level: "primary",
        parentId: null,
        collapsed: false,
      };
      items.set(defaultId, defaultItem);
      setItemIds([defaultId]);
      setInitialized(true);
    }
  });

  // Add new item
  function addItem(level: "primary" | "secondary" | "tertiary", parentId: string | null) {
    const newId = generateId();
    const newItem: NavItem = {
      id: newId,
      label: "",
      pageTitle: "",
      url: "",
      level: level,
      parentId: parentId,
      collapsed: false,
    };
    items.set(newId, newItem);

    // Insert after parent and its children
    if (parentId) {
      const parentIndex = itemIds.indexOf(parentId);
      const children = getChildren(parentId);
      const insertIndex = parentIndex + children.length + 1;
      const newIds = [...itemIds];
      newIds.splice(insertIndex, 0, newId);
      setItemIds(newIds);
    } else {
      setItemIds([...itemIds, newId]);
    }
    setSelectedId(newId);
  }

  // Delete item and all its children
  function deleteItem(id: string) {
    const children = getAllDescendants(id);
    const toDelete = [id, ...children];

    toDelete.forEach(itemId => items.delete(itemId));
    setItemIds(itemIds.filter(itemId => !toDelete.includes(itemId)));

    if (selectedId === id || (selectedId && toDelete.includes(selectedId))) {
      setSelectedId(null);
    }
  }

  // Get direct children of an item
  function getChildren(parentId: string): string[] {
    return itemIds.filter(id => {
      const item = items.get(id);
      return item && item.parentId === parentId;
    });
  }

  // Get all descendants recursively
  function getAllDescendants(parentId: string): string[] {
    const children = getChildren(parentId);
    const descendants = [...children];
    children.forEach(childId => {
      descendants.push(...getAllDescendants(childId));
    });
    return descendants;
  }

  // Move item up
  function moveUp(id: string) {
    const item = items.get(id);
    if (!item) return;

    const siblings = itemIds.filter(sibId => {
      const sib = items.get(sibId);
      return sib && sib.parentId === item.parentId && sib.level === item.level;
    });

    const currentIndex = siblings.indexOf(id);
    if (currentIndex <= 0) return;

    const prevSiblingId = siblings[currentIndex - 1];
    const itemChildren = getAllDescendants(id);
    const itemBlock = [id, ...itemChildren];

    const newIds = itemIds.filter(i => !itemBlock.includes(i));
    const insertIndex = newIds.indexOf(prevSiblingId);
    newIds.splice(insertIndex, 0, ...itemBlock);

    setItemIds(newIds);
  }

  // Move item down
  function moveDown(id: string) {
    const item = items.get(id);
    if (!item) return;

    const siblings = itemIds.filter(sibId => {
      const sib = items.get(sibId);
      return sib && sib.parentId === item.parentId && sib.level === item.level;
    });

    const currentIndex = siblings.indexOf(id);
    if (currentIndex >= siblings.length - 1) return;

    const nextSiblingId = siblings[currentIndex + 1];
    const itemChildren = getAllDescendants(id);
    const itemBlock = [id, ...itemChildren];
    const nextChildren = getAllDescendants(nextSiblingId);
    const nextBlock = [nextSiblingId, ...nextChildren];

    const newIds = itemIds.filter(i => !itemBlock.includes(i));
    const insertIndex = newIds.indexOf(nextSiblingId) + nextBlock.length;
    newIds.splice(insertIndex, 0, ...itemBlock);

    setItemIds(newIds);
  }

  // Toggle collapsed state
  function toggleCollapsed(id: string) {
    const item = items.get(id);
    if (item) {
      items.set(id, { ...item, collapsed: !item.collapsed });
    }
  }

  // Update item field
  function updateItem(id: string, field: keyof NavItem, value: string | boolean) {
    const item = items.get(id);
    if (item) {
      items.set(id, { ...item, [field]: value });
    }
  }

  // Check if item should be hidden (parent is collapsed)
  function isHidden(id: string): boolean {
    const item = items.get(id);
    if (!item || !item.parentId) return false;

    const parent = items.get(item.parentId);
    if (!parent) return false;

    if (parent.collapsed) return true;
    return isHidden(item.parentId);
  }

  // Get indent level
  function getIndentLevel(item: NavItem): number {
    if (item.level === "primary") return 0;
    if (item.level === "secondary") return 1;
    return 2;
  }

  // Check if can move up/down
  function canMoveUp(id: string): boolean {
    const item = items.get(id);
    if (!item) return false;

    const siblings = itemIds.filter(sibId => {
      const sib = items.get(sibId);
      return sib && sib.parentId === item.parentId && sib.level === item.level;
    });

    return siblings.indexOf(id) > 0;
  }

  function canMoveDown(id: string): boolean {
    const item = items.get(id);
    if (!item) return false;

    const siblings = itemIds.filter(sibId => {
      const sib = items.get(sibId);
      return sib && sib.parentId === item.parentId && sib.level === item.level;
    });

    return siblings.indexOf(id) < siblings.length - 1;
  }

  // Property menu
  usePropertyMenu(
    [
      {
        itemType: "color-selector",
        tooltip: "Card Color",
        propertyName: "cardColor",
        options: colors.map((color, index) => ({
          tooltip: colorNames[index],
          option: color
        })),
        selectedOption: cardColor,
      },
    ],
    ({ propertyName, propertyValue }) => {
      if (propertyName === "cardColor" && propertyValue) {
        setCardColor(propertyValue);
      }
    }
  );

  const shadow: WidgetJSX.Effect = {
    type: "drop-shadow",
    color: "#00000040",
    offset: { x: 0, y: 5 },
    blur: 15,
    showShadowBehindNode: false,
  };

  return (
    <AutoLayout
      name="Website Navigation"
      direction="vertical"
      width={450}
      fill={cardColor}
      padding={12}
      spacing={8}
      cornerRadius={12}
      stroke="#333333"
      strokeWidth={2}
      effect={shadow}
    >
      {/* Header */}
      <AutoLayout
        direction="horizontal"
        width="fill-parent"
        verticalAlignItems="center"
        spacing={8}
      >
        <Text
          fontSize={14}
          fontWeight={700}
          fontFamily="Roboto Mono"
          fill="#333333"
        >
          WEBSITE NAVIGATION
        </Text>
        <AutoLayout width="fill-parent" />

        {/* Legend */}
        <AutoLayout direction="horizontal" spacing={6}>
          {[
            { label: "PRI", color: levelColors.primary },
            { label: "SEC", color: levelColors.secondary },
            { label: "TER", color: levelColors.tertiary },
          ].map(({ label, color }) => (
            <AutoLayout key={label} direction="horizontal" spacing={3} verticalAlignItems="center">
              <SVG
                src={`<svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"><circle cx="6" cy="6" r="5" fill="${color}" stroke="#FFFFFF" stroke-width="2"/></svg>`}
              />
              <Text fontSize={10} fontFamily="Roboto Mono" fontWeight={700} fill="#666666">
                {label}
              </Text>
            </AutoLayout>
          ))}
        </AutoLayout>
      </AutoLayout>

      {/* Hostname Field */}
      <AutoLayout direction="vertical" width="fill-parent" spacing={4}>
        <Text
          fontSize={11}
          fontWeight={700}
          fontFamily="Roboto Mono"
          fill="#333333"
        >
          HOSTNAME
        </Text>
        <Input
          width="fill-parent"
          placeholder="e.g., www.example.com"
          value={hostname}
          fontSize={12}
          fontFamily="Roboto Mono"
          onTextEditEnd={(e) => setHostname(e.characters)}
          inputFrameProps={{
            fill: "#FFFFFF",
            stroke: "#333333",
            strokeWidth: 1.5,
            padding: { horizontal: 12, vertical: 12 },
            cornerRadius: 8,
          }}
        />
      </AutoLayout>

      {/* Navigation Items */}
      <AutoLayout
        direction="vertical"
        width="fill-parent"
        spacing={6}
      >
        {itemIds.map(id => {
          const item = items.get(id);
          if (!item || isHidden(id)) return null;

          const indentLevel = getIndentLevel(item);
          const hasChildren = getChildren(id).length > 0;
          const dotColor = levelColors[item.level];
          const isSelected = selectedId === id;

          return (
            <AutoLayout
              key={id}
              direction="vertical"
              width="fill-parent"
              spacing={4}
              padding={{ left: indentLevel * 20 }}
            >
              {/* Nav Item Row */}
              <AutoLayout
                direction="horizontal"
                width="fill-parent"
                spacing={4}
                verticalAlignItems="center"
              >
                {/* Collapse arrow (only if has children) */}
                {hasChildren ? (
                  <AutoLayout
                    width={24}
                    height={24}
                    horizontalAlignItems="center"
                    verticalAlignItems="center"
                    fill="#F5F5F5"
                    stroke="#333333"
                    strokeWidth={1.5}
                    cornerRadius={4}
                    onClick={() => toggleCollapsed(id)}
                    hoverStyle={{ opacity: 0.7 }}
                    tooltip={item.collapsed ? "Expand" : "Collapse"}
                  >
                    <SVG
                      src={item.collapsed
                        ? `<svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"><path d="M4 3L7 6L4 9" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
                        : `<svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"><path d="M3 4L6 7L9 4" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
                      }
                    />
                  </AutoLayout>
                ) : (
                  <AutoLayout width={24} height={24} />
                )}

                {/* Connection dot - This is clickable for drawing lines */}
                <Rectangle
                  name={`connection-${item.level}-${id}`}
                  width={12}
                  height={12}
                  fill={dotColor}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  cornerRadius={6}
                />

                {/* Label input */}
                <Input
                  value={item.label}
                  placeholder={`${item.level} label...`}
                  fontSize={item.level === "primary" ? 13 : 12}
                  fontWeight={item.level === "primary" ? 700 : 600}
                  fontFamily="Roboto Mono"
                  width="fill-parent"
                  onTextEditEnd={(e) => updateItem(id, "label", e.characters)}
                  onClick={() => setSelectedId(id)}
                  inputFrameProps={{
                    fill: "#FFFFFF",
                    stroke: isSelected ? "#333333" : "#CCCCCC",
                    strokeWidth: 1.5,
                    padding: { horizontal: 8, vertical: 6 },
                    cornerRadius: 6,
                  }}
                />

                {/* Up/Down arrows */}
                <AutoLayout
                  direction="vertical"
                  spacing={2}
                  padding={4}
                  fill="#E8E8E8"
                  cornerRadius={4}
                  stroke="#CCCCCC"
                  strokeWidth={1.5}
                >
                  <SVG
                    src={`<svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"><path d="M6 9L6 3M6 3L3 6M6 3L9 6" stroke="${canMoveUp(id) ? '#333333' : '#CCCCCC'}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`}
                    opacity={canMoveUp(id) ? 1 : 0.3}
                    onClick={() => canMoveUp(id) && moveUp(id)}
                    hoverStyle={{ opacity: canMoveUp(id) ? 0.7 : 0.3 }}
                    tooltip={canMoveUp(id) ? "Move up" : ""}
                  />
                  <SVG
                    src={`<svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"><path d="M6 3L6 9M6 9L9 6M6 9L3 6" stroke="${canMoveDown(id) ? '#333333' : '#CCCCCC'}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`}
                    opacity={canMoveDown(id) ? 1 : 0.3}
                    onClick={() => canMoveDown(id) && moveDown(id)}
                    hoverStyle={{ opacity: canMoveDown(id) ? 0.7 : 0.3 }}
                    tooltip={canMoveDown(id) ? "Move down" : ""}
                  />
                </AutoLayout>

                {/* Delete button */}
                <AutoLayout
                  width={20}
                  height={20}
                  horizontalAlignItems="center"
                  verticalAlignItems="center"
                >
                  <SVG
                    src={`<svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"><path d="M9 3L3 9M3 3L9 9" stroke="#666666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`}
                    opacity={0}
                    hoverStyle={{ opacity: 1 }}
                    onClick={() => deleteItem(id)}
                    tooltip="Delete (cascades to children)"
                  />
                </AutoLayout>
              </AutoLayout>

              {/* Page Title and URL Fields */}
              {!item.collapsed && (
                <AutoLayout
                  direction="vertical"
                  width="fill-parent"
                  spacing={4}
                  padding={{ left: 36 }}
                >
                  {/* Page Title */}
                  <AutoLayout direction="horizontal" width="fill-parent" spacing={4} verticalAlignItems="center">
                    <Text fontSize={10} fontFamily="Roboto Mono" fontWeight={700} fill="#666666" width={60}>
                      PAGE:
                    </Text>
                    <Input
                      value={item.pageTitle}
                      placeholder="Page title..."
                      fontSize={11}
                      fontFamily="Roboto Mono"
                      width="fill-parent"
                      onTextEditEnd={(e) => updateItem(id, "pageTitle", e.characters)}
                      inputFrameProps={{
                        fill: "#E8E8E8",
                        stroke: "#CCCCCC",
                        strokeWidth: 1.5,
                        padding: { horizontal: 6, vertical: 4 },
                        cornerRadius: 4,
                      }}
                    />
                  </AutoLayout>

                  {/* URL */}
                  <AutoLayout direction="horizontal" width="fill-parent" spacing={4} verticalAlignItems="center">
                    <Text fontSize={10} fontFamily="Roboto Mono" fontWeight={700} fill="#666666" width={60}>
                      URL:
                    </Text>
                    <Input
                      value={item.url}
                      placeholder="/path..."
                      fontSize={11}
                      fontFamily="Roboto Mono"
                      width="fill-parent"
                      onTextEditEnd={(e) => updateItem(id, "url", e.characters)}
                      inputFrameProps={{
                        fill: "#E8E8E8",
                        stroke: "#CCCCCC",
                        strokeWidth: 1.5,
                        padding: { horizontal: 6, vertical: 4 },
                        cornerRadius: 4,
                      }}
                    />
                  </AutoLayout>
                </AutoLayout>
              )}
            </AutoLayout>
          );
        })}
      </AutoLayout>

      {/* Add buttons */}
      <AutoLayout
        direction="vertical"
        width="fill-parent"
        spacing={4}
      >
        {/* Add Primary */}
        <AutoLayout
          width="fill-parent"
          height={30}
          fill="#F5F5F5"
          stroke="#CCCCCC"
          strokeWidth={1.5}
          cornerRadius={6}
          horizontalAlignItems="center"
          verticalAlignItems="center"
          spacing={4}
          onClick={() => addItem("primary", null)}
          hoverStyle={{ fill: "#E8E8E8" }}
          tooltip="Add primary navigation"
        >
          <Text fontSize={16} fill="#666666">+</Text>
          <Text fontSize={11} fontFamily="Roboto Mono" fontWeight={700} fill="#666666">
            ADD PRIMARY
          </Text>
        </AutoLayout>

        {/* Add Secondary (only if primary is selected) */}
        {selectedId && items.get(selectedId)?.level === "primary" && (
          <AutoLayout
            width="fill-parent"
            height={30}
            fill="#F5F5F5"
            stroke="#CCCCCC"
            strokeWidth={1.5}
            cornerRadius={6}
            horizontalAlignItems="center"
            verticalAlignItems="center"
            spacing={4}
            onClick={() => addItem("secondary", selectedId)}
            hoverStyle={{ fill: "#E8E8E8" }}
            tooltip="Add secondary navigation under selected primary"
          >
            <Text fontSize={16} fill="#666666">+</Text>
            <Text fontSize={11} fontFamily="Roboto Mono" fontWeight={700} fill="#666666">
              ADD SECONDARY
            </Text>
          </AutoLayout>
        )}

        {/* Add Tertiary (only if secondary is selected) */}
        {selectedId && items.get(selectedId)?.level === "secondary" && (
          <AutoLayout
            width="fill-parent"
            height={30}
            fill="#F5F5F5"
            stroke="#CCCCCC"
            strokeWidth={1.5}
            cornerRadius={6}
            horizontalAlignItems="center"
            verticalAlignItems="center"
            spacing={4}
            onClick={() => addItem("tertiary", selectedId)}
            hoverStyle={{ fill: "#E8E8E8" }}
            tooltip="Add tertiary navigation under selected secondary"
          >
            <Text fontSize={16} fill="#666666">+</Text>
            <Text fontSize={11} fontFamily="Roboto Mono" fontWeight={700} fill="#666666">
              ADD TERTIARY
            </Text>
          </AutoLayout>
        )}
      </AutoLayout>
    </AutoLayout>
  );
}

widget.register(WebsiteNavigation);
