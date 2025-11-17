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

const colors: string[] = ["#FFA198", "#BDE3FF", "#AFF4C6", "#FFE8A3", "#FFFFFF", "#E8E8E8"];
const colorNames: string[] = ["Coral", "Blue", "Green", "Yellow", "White", "Light Grey"];

const initialRows: { rowKey: string; text: string; color?: string }[] = [
  { rowKey: "row1", text: "", color: colors[5] },
];

function CollapsibleTaskCard() {
  const [initialized, setInitialized] = useSyncedState<boolean>(
    "initialized",
    false
  );
  const [collapsed, setCollapsed] = useSyncedState("collapsed", false);
  const [pageTitle, setPageTitle] = useSyncedState("pageTitle", "");
  const [url, setUrl] = useSyncedState("url", "");
  const [cartId, setCartId] = useSyncedState("cartId", "");
  const [briefed, setBriefed] = useSyncedState<boolean>(
    "briefed",
    false
  );
  const [designed, setDesigned] = useSyncedState<boolean>("designed", false);
  const [built, setBuilt] = useSyncedState<boolean>("built", false);
  const [done, setDone] = useSyncedState<boolean>("done", false);
  const [lastUpdated, setLastUpdated] = useSyncedState<string>("lastUpdated", new Date().toLocaleDateString());
  const [rowKeys, setRowKeys] = useSyncedState<string[]>(
    "rowsNum",
    initialRows.map((header) => header.rowKey)
  );
  const [color, setColor] = useSyncedState("color", colors[4]);
  const [selectedRowKey, setSelectedRowKey] = useSyncedState<string | null>("selectedRowKey", null);
  const rows = useSyncedMap<string>("rows");
  const rowColors = useSyncedMap<string>("rowColors");

  // Add new row
  const addRow = () => {
    const newKey = (
      "00000" + Math.floor(Math.random() * 1_000_000).toString()
    ).slice(-6);

    if (rowKeys.includes(newKey)) {
      addRow();
    } else {
      setRowKeys([...rowKeys, newKey]);
      rowColors.set(newKey, colors[5]);
    }
  };

  // Delete row
  const deleteRow = (rowKey: string) => {
    setRowKeys(rowKeys.filter((key) => key !== rowKey));
    rows.delete(rowKey);
    rowColors.delete(rowKey);
  };

  // Move row up
  const moveRowUp = (rowKey: string) => {
    const index = rowKeys.indexOf(rowKey);
    if (index > 0) {
      const newKeys = [...rowKeys];
      [newKeys[index - 1], newKeys[index]] = [newKeys[index], newKeys[index - 1]];
      setRowKeys(newKeys);
    }
  };

  // Move row down
  const moveRowDown = (rowKey: string) => {
    const index = rowKeys.indexOf(rowKey);
    if (index < rowKeys.length - 1) {
      const newKeys = [...rowKeys];
      [newKeys[index], newKeys[index + 1]] = [newKeys[index + 1], newKeys[index]];
      setRowKeys(newKeys);
    }
  };

  // Duplicate widget
  const duplicateWidget = () => {
    figma.notify("To duplicate: Hold Option/Alt and drag the widget");
  };

  // Calculate progress percentage
  const getProgressPercentage = (): number => {
    let progress = 0;
    if (briefed) progress += 25;
    if (designed) progress += 25;
    if (built) progress += 25;
    if (done) progress += 25;
    return progress;
  };

  // Update last modified date
  const updateLastModified = () => {
    setLastUpdated(new Date().toLocaleDateString());
  };

  // Initialize widget with default rows
  useEffect(() => {
    if (initialized) return;
    setInitialized(true);
    initialRows.forEach((initialRow) => {
      rows.set(initialRow.rowKey, initialRow.text || "");
      rowColors.set(initialRow.rowKey, initialRow.color || colors[5]);
    });
  });

  // Widget property menu
  usePropertyMenu(
    [
      {
        itemType: "toggle",
        tooltip: collapsed ? "Expand" : "Collapse",
        propertyName: "toggle-collapsed",
        isToggled: false,
      },
      {
        itemType: "color-selector",
        tooltip: "Card Color",
        propertyName: "color",
        options: colors.map((color, index) => ({
          tooltip: colorNames[index],
          option: color
        })),
        selectedOption: color,
      },
      {
        itemType: "color-selector",
        tooltip: "Row Color (select a row first)",
        propertyName: "rowColor",
        options: colors.map((color, index) => ({
          tooltip: colorNames[index],
          option: color
        })),
        selectedOption: selectedRowKey ? (rowColors.get(selectedRowKey) ?? colors[0]) : colors[0],
      },
    ],
    ({ propertyName, propertyValue }) => {
      if (propertyName === "toggle-collapsed") {
        setCollapsed(!collapsed);
      } else if (propertyName === "color" && propertyValue) {
        setColor(propertyValue);
      } else if (propertyName === "rowColor" && propertyValue && selectedRowKey) {
        rowColors.set(selectedRowKey, propertyValue);
      }
    }
  );

  const width: WidgetJSX.Size = 450;

  const shadow: WidgetJSX.Effect = {
    type: "drop-shadow",
    color: "#00000040",
    offset: { x: 0, y: 5 },
    blur: 15,
    showShadowBehindNode: false,
  };

  const toggleButtonShadow: WidgetJSX.Effect = {
    type: "inner-shadow",
    color: "#00000040",
    offset: { x: 0, y: 0 },
    blur: 2,
  };

  return (
    <AutoLayout
      name="Collapsible Task Card"
      direction="vertical"
      horizontalAlignItems="center"
      verticalAlignItems="center"
      width={width}
      fill={color}
      spacing={8}
      padding={12}
      cornerRadius={10}
      overflow="visible"
      effect={shadow}
      stroke="#333333"
      strokeWidth={2}
    >
      {/* Header */}
      <AutoLayout
        direction="horizontal"
        horizontalAlignItems="center"
        verticalAlignItems="center"
        width={"fill-parent"}
        height={"hug-contents"}
        spacing={8}
      >
        {/* Collapse/Expand Arrow */}
        <AutoLayout
          padding={8}
          fill="#F5F5F5"
          stroke="#333333"
          strokeWidth={1.5}
          cornerRadius={6}
          onClick={() => setCollapsed(!collapsed)}
          hoverStyle={{ opacity: 0.7 }}
          tooltip={collapsed ? "Expand" : "Collapse"}
        >
          <SVG
            src={collapsed
              ? `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 20L24 28L32 20" stroke="#333333" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`
              : `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 28L24 20L32 28" stroke="#333333" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`
            }
          />
        </AutoLayout>

        {/* Duplicate Button */}
        <AutoLayout
          padding={8}
          fill="#F5F5F5"
          stroke="#333333"
          strokeWidth={1.5}
          cornerRadius={6}
          hoverStyle={{ fill: "#E8E8E8" }}
          onClick={duplicateWidget}
          tooltip="Duplicate this card"
        >
          <SVG
            src={`<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="14" y="14" width="20" height="20" rx="3" stroke="#333333" stroke-width="3"/><path d="M8 22H6C4.89543 22 4 21.1046 4 20V6C4 4.89543 4.89543 4 6 4H20C21.1046 4 22 4.89543 22 6V8" stroke="#333333" stroke-width="3"/></svg>`}
          />
        </AutoLayout>

        <AutoLayout width={"fill-parent"} />

        {/* Status Checkboxes */}
        <AutoLayout
          direction="horizontal"
          spacing={4}
        >
          {[
            {
              text: "BRIEFED",
              state: briefed,
              setState: (val: boolean) => { setBriefed(val); updateLastModified(); },
              color: "#4A90E2",
            },
            {
              text: "DESIGNED",
              state: designed,
              setState: (val: boolean) => { setDesigned(val); updateLastModified(); },
              color: "#9B59B6",
            },
            {
              text: "BUILT",
              state: built,
              setState: (val: boolean) => { setBuilt(val); updateLastModified(); },
              color: "#F39C12",
            },
            {
              text: "DONE",
              state: done,
              setState: (val: boolean) => { setDone(val); updateLastModified(); },
              color: "#4CAF50",
            },
          ].map((status) => (
            <AutoLayout
              key={status.text}
              direction="vertical"
              spacing={3}
              width={60}
              horizontalAlignItems="center"
              verticalAlignItems="center"
              onClick={() => status.setState(!status.state)}
              hoverStyle={{ opacity: 0.7 }}
            >
              <AutoLayout
                width={27}
                height={27}
                fill={status.state ? status.color : "#FFFFFF"}
                stroke="#333333"
                strokeWidth={1.5}
                cornerRadius={3}
                horizontalAlignItems="center"
                verticalAlignItems="center"
              />
              <Text fontSize={10} fontFamily="Roboto Mono" fill="#333333" fontWeight={700}>
                {status.text}
              </Text>
            </AutoLayout>
          ))}
        </AutoLayout>
      </AutoLayout>

      {/* Live Date Field */}
      <AutoLayout direction="horizontal" width={"fill-parent"} spacing={6} verticalAlignItems="center">
        <Text fontSize={10} fontFamily="Roboto Mono" fill="#333333" fontWeight={700}>
          LIVE DATE:
        </Text>
        <Input
          value={lastUpdated}
          fontSize={10}
          fontFamily="Roboto Mono"
          onTextEditEnd={(e) => setLastUpdated(e.characters)}
          inputFrameProps={{
            fill: "#FFFFFF",
            stroke: "#333333",
            strokeWidth: 1.5,
            padding: { horizontal: 6, vertical: 3 },
            cornerRadius: 3,
          }}
        />
      </AutoLayout>

      {/* Page Title - Main Field */}
      <AutoLayout direction="vertical" width={"fill-parent"} spacing={4}>
        <Text
          fontSize={11}
          fontWeight={700}
          fontFamily="Roboto Mono"
          fill="#333333"
        >
          PAGE TITLE
        </Text>
        <Input
          width={"fill-parent"}
          placeholder="Enter page title..."
          value={pageTitle}
          fontSize={24}
          fontWeight={700}
          fontFamily="Roboto Mono"
          lineHeight={30}
          onTextEditEnd={(e) => {
            setPageTitle(e.characters);
          }}
          inputBehavior="multiline"
          inputFrameProps={{
            fill: "#FFFFFF",
            stroke: "#333333",
            strokeWidth: 1.5,
            padding: { horizontal: 12, vertical: 12 },
            cornerRadius: 8,
          }}
        />
      </AutoLayout>

      {/* URL Field */}
      <AutoLayout direction="vertical" width={"fill-parent"} spacing={4}>
        <Text
          fontSize={11}
          fontWeight={700}
          fontFamily="Roboto Mono"
          fill="#333333"
        >
          URL
        </Text>
        <Input
          width={"fill-parent"}
          placeholder="https://..."
          value={url}
          fontSize={12}
          fontFamily="Roboto Mono"
          onTextEditEnd={(e) => {
            setUrl(e.characters);
          }}
          inputFrameProps={{
            fill: "#FFFFFF",
            stroke: "#333333",
            strokeWidth: 1.5,
            padding: { horizontal: 10, vertical: 8 },
            cornerRadius: 6,
          }}
        />
      </AutoLayout>

      {/* Collapsible Content */}
      <AutoLayout
        direction="vertical"
        width={"fill-parent"}
        spacing={6}
        hidden={collapsed}
      >
        {/* Text Rows */}
        <AutoLayout
          direction="vertical"
          width={"fill-parent"}
          spacing={3}
        >

          {rowKeys.map((rowKey, index) => {
            const rowContent = rows.get(rowKey) ?? "";
            const rowColor = rowColors.get(rowKey) ?? colors[0];
            const isSelected = selectedRowKey === rowKey;
            const isFirst = index === 0;
            const isLast = index === rowKeys.length - 1;

            return (
              <AutoLayout
                key={rowKey}
                direction="horizontal"
                width={"fill-parent"}
                verticalAlignItems="center"
                spacing={6}
                onClick={() => setSelectedRowKey(rowKey)}
                cornerRadius={8}
              >
                {/* Reorder controls */}
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
                    src={`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 12L8 4M8 4L5 7M8 4L11 7" stroke="${isFirst ? '#CCCCCC' : '#333333'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`}
                    opacity={isFirst ? 0.4 : 1}
                    hoverStyle={{ opacity: isFirst ? 0.4 : 1 }}
                    onClick={() => { if (!isFirst) moveRowUp(rowKey); }}
                    tooltip={isFirst ? "" : "Move up"}
                  />
                  <SVG
                    src={`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 4L8 12M8 12L11 9M8 12L5 9" stroke="${isLast ? '#CCCCCC' : '#333333'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`}
                    opacity={isLast ? 0.4 : 1}
                    hoverStyle={{ opacity: isLast ? 0.4 : 1 }}
                    onClick={() => { if (!isLast) moveRowDown(rowKey); }}
                    tooltip={isLast ? "" : "Move down"}
                  />
                </AutoLayout>

                {/* Row content with delete button */}
                <AutoLayout
                  width={"fill-parent"}
                  direction="horizontal"
                  verticalAlignItems="center"
                  spacing={4}
                >
                  <Input
                    value={rowContent}
                    placeholder=""
                    onTextEditEnd={(e) => rows.set(rowKey, e.characters)}
                    inputBehavior="multiline"
                    width={"fill-parent"}
                    fontSize={12}
                    fontFamily="Roboto Mono"
                    inputFrameProps={{
                      fill: rowColor,
                      stroke: isSelected ? "#333333" : "#CCCCCC",
                      strokeWidth: 1.5,
                      padding: { horizontal: 10, vertical: 8 },
                      cornerRadius: 6,
                      height: rowContent ? "hug-contents" : 50,
                    }}
                  />
                  {/* Delete button */}
                  <AutoLayout
                    padding={2}
                  >
                    <SVG
                      src={`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 6L6 10M6 6L10 10" stroke="#666666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`}
                      opacity={0}
                      hoverStyle={{ opacity: 1 }}
                      onClick={() => deleteRow(rowKey)}
                      tooltip="Delete row"
                    />
                  </AutoLayout>
                </AutoLayout>
              </AutoLayout>
            );
          })}
        </AutoLayout>
      </AutoLayout>

      {/* Add Row Button */}
      <AutoLayout
        hidden={collapsed}
        width={"fill-parent"}
        height={30}
        fill={"#F5F5F5"}
        stroke="#CCCCCC"
        strokeWidth={1.5}
        hoverStyle={{ fill: "#E8E8E8" }}
        cornerRadius={6}
        horizontalAlignItems="center"
        verticalAlignItems="center"
        spacing={4}
        onClick={addRow}
        tooltip="Add new row"
      >
        <Text fontSize={16} fill={"#666666"} fontWeight={400}>
          +
        </Text>
        <Text
          fontSize={11}
          fontFamily="Roboto Mono"
          fontWeight={700}
          fill={"#666666"}
        >
          ADD ROW
        </Text>
      </AutoLayout>

      {/* Cart ID Field */}
      <AutoLayout
        direction="vertical"
        width={"fill-parent"}
        spacing={4}
        hidden={collapsed}
      >
        <Text
          fontSize={11}
          fontWeight={700}
          fontFamily="Roboto Mono"
          fill="#333333"
        >
          CART ID (IF RELEVANT)
        </Text>
        <Input
          width={"fill-parent"}
          placeholder="Optional cart identifier..."
          value={cartId}
          fontSize={12}
          fontFamily="Roboto Mono"
          onTextEditEnd={(e) => {
            setCartId(e.characters);
          }}
          inputFrameProps={{
            fill: "#FFFFFF",
            stroke: "#CCCCCC",
            strokeWidth: 1.5,
            padding: { horizontal: 10, vertical: 8 },
            cornerRadius: 6,
          }}
        />
      </AutoLayout>
    </AutoLayout>
  );
}

widget.register(CollapsibleTaskCard);
