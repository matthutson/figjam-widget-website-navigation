const { widget } = figma;
const {
  AutoLayout,
  Input,
  SVG,
  Text,
  useSyncedState,
  useSyncedMap,
  usePropertyMenu,
} = widget;

// Level colors for connection dots
const levelColors = {
  primary: "#4A90E2",    // Blue
  secondary: "#9B59B6",  // Purple
  tertiary: "#F39C12",   // Orange
};

// Card background colors
const colors: string[] = ["#FFFFFF", "#E8F5F5", "#F5F5E8", "#F5E8F5", "#E8E8E8"];
const colorNames: string[] = ["White", "Light Cyan", "Light Yellow", "Light Purple", "Light Grey"];

interface NavItem {
  id: string;
  label: string;
  level: "primary" | "secondary" | "tertiary";
  parentId: string | null;
  collapsed: boolean;
}

function WebsiteNavigation() {
  const [initialized, setInitialized] = useSyncedState<boolean>("initialized", false);
  const [itemIds, setItemIds] = useSyncedState<string[]>("itemIds", []);
  const [selectedId, setSelectedId] = useSyncedState<string | null>("selectedId", null);
  const [cardColor, setCardColor] = useSyncedState("cardColor", colors[0]);
  const items = useSyncedMap<NavItem>("items");

  // Generate random ID
  function generateId(): string {
    return ("00000" + Math.floor(Math.random() * 1_000_000).toString()).slice(-6);
  }

  // Initialize with default item
  if (!initialized) {
    const defaultId = "000001"; // Static ID for initial item
    const defaultItem: NavItem = {
      id: defaultId,
      label: "Home",
      level: "primary",
      parentId: null,
      collapsed: false,
    };
    items.set(defaultId, defaultItem);
    setItemIds([defaultId]);
    setInitialized(true);
  }

  // Add new item
  function addItem(level: "primary" | "secondary" | "tertiary", parentId: string | null) {
    const newId = generateId();
    const newItem: NavItem = {
      id: newId,
      label: "",
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

    // Get siblings (items with same parent and level)
    const siblings = itemIds.filter(sibId => {
      const sib = items.get(sibId);
      return sib && sib.parentId === item.parentId && sib.level === item.level;
    });

    const currentIndex = siblings.indexOf(id);
    if (currentIndex <= 0) return;

    const prevSiblingId = siblings[currentIndex - 1];
    const itemIndex = itemIds.indexOf(id);
    const prevIndex = itemIds.indexOf(prevSiblingId);

    // Move item and its children before previous sibling
    const itemChildren = getAllDescendants(id);
    const itemBlock = [id, ...itemChildren];
    const prevChildren = getAllDescendants(prevSiblingId);
    const prevBlock = [prevSiblingId, ...prevChildren];

    const newIds = itemIds.filter(i => !itemBlock.includes(i));
    const insertIndex = newIds.indexOf(prevSiblingId);
    newIds.splice(insertIndex, 0, ...itemBlock);

    setItemIds(newIds);
  }

  // Move item down
  function moveDown(id: string) {
    const item = items.get(id);
    if (!item) return;

    // Get siblings
    const siblings = itemIds.filter(sibId => {
      const sib = items.get(sibId);
      return sib && sib.parentId === item.parentId && sib.level === item.level;
    });

    const currentIndex = siblings.indexOf(id);
    if (currentIndex >= siblings.length - 1) return;

    const nextSiblingId = siblings[currentIndex + 1];

    // Move item and its children after next sibling
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

  // Update label
  function updateLabel(id: string, label: string) {
    const item = items.get(id);
    if (item) {
      items.set(id, { ...item, label });
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
      cornerRadius={10}
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
                src={`<svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"><circle cx="6" cy="6" r="5" fill="${color}" stroke="#333333" stroke-width="1.5"/></svg>`}
              />
              <Text fontSize={9} fontFamily="Roboto Mono" fontWeight={700} fill="#666666">
                {label}
              </Text>
            </AutoLayout>
          ))}
        </AutoLayout>
      </AutoLayout>

      {/* Navigation Items */}
      <AutoLayout
        direction="vertical"
        width="fill-parent"
        spacing={4}
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
              direction="horizontal"
              width="fill-parent"
              spacing={4}
              verticalAlignItems="center"
              padding={{ left: indentLevel * 20 }}
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

              {/* Connection dot */}
              <SVG
                src={`<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6" fill="${dotColor}" stroke="#333333" stroke-width="1.5"/></svg>`}
              />

              {/* Label input */}
              <Input
                value={item.label}
                placeholder={`${item.level} nav...`}
                fontSize={12}
                fontFamily="Roboto Mono"
                width="fill-parent"
                onTextEditEnd={(e) => updateLabel(id, e.characters)}
                onClick={() => setSelectedId(id)}
                inputFrameProps={{
                  fill: "#FFFFFF",
                  stroke: isSelected ? "#333333" : "#CCCCCC",
                  strokeWidth: 1.5,
                  padding: { horizontal: 8, vertical: 6 },
                  cornerRadius: 4,
                }}
              />

              {/* Up/Down arrows */}
              <AutoLayout
                direction="vertical"
                spacing={2}
                padding={3}
                fill="#E8E8E8"
                cornerRadius={4}
                stroke="#CCCCCC"
                strokeWidth={1.5}
              >
                <SVG
                  src={`<svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg"><path d="M7 10L7 4M7 4L4 7M7 4L10 7" stroke="${canMoveUp(id) ? '#333333' : '#CCCCCC'}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`}
                  opacity={canMoveUp(id) ? 1 : 0.3}
                  onClick={() => canMoveUp(id) && moveUp(id)}
                  hoverStyle={{ opacity: canMoveUp(id) ? 0.7 : 0.3 }}
                  tooltip={canMoveUp(id) ? "Move up" : ""}
                />
                <SVG
                  src={`<svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg"><path d="M7 4L7 10M7 10L10 7M7 10L4 7" stroke="${canMoveDown(id) ? '#333333' : '#CCCCCC'}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`}
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
                  src={`<svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg"><path d="M10 4L4 10M4 4L10 10" stroke="#666666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`}
                  opacity={0}
                  hoverStyle={{ opacity: 1 }}
                  onClick={() => deleteItem(id)}
                  tooltip="Delete (cascades to children)"
                />
              </AutoLayout>
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
          height={28}
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
          <Text fontSize={14} fill="#666666">+</Text>
          <Text fontSize={10} fontFamily="Roboto Mono" fontWeight={700} fill="#666666">
            ADD PRIMARY
          </Text>
        </AutoLayout>

        {/* Add Secondary (only if primary is selected) */}
        {selectedId && items.get(selectedId)?.level === "primary" && (
          <AutoLayout
            width="fill-parent"
            height={28}
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
            <Text fontSize={14} fill="#666666">+</Text>
            <Text fontSize={10} fontFamily="Roboto Mono" fontWeight={700} fill="#666666">
              ADD SECONDARY
            </Text>
          </AutoLayout>
        )}

        {/* Add Tertiary (only if secondary is selected) */}
        {selectedId && items.get(selectedId)?.level === "secondary" && (
          <AutoLayout
            width="fill-parent"
            height={28}
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
            <Text fontSize={14} fill="#666666">+</Text>
            <Text fontSize={10} fontFamily="Roboto Mono" fontWeight={700} fill="#666666">
              ADD TERTIARY
            </Text>
          </AutoLayout>
        )}
      </AutoLayout>
    </AutoLayout>
  );
}

widget.register(WebsiteNavigation);
