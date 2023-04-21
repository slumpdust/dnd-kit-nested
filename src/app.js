import React, { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  arrayMove,
  sortableKeyboardCoordinates,
  SortableContext,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";

import announcements from "./announcements";
import SortableContainer, { Container } from "./container";
import SortableItem, { Item } from "./sortable_item";

const wrapperStyle = {
  background: "#e9e9e9",
  padding: "50px 10px",
  borderRadius: 8,
  margin: 50
};

export default function App() {
  const [data, setData] = useState({
    items: []
  });
  const [activeId, setActiveId] = useState();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  return (
    <div>
      <div>
        <button onClick={addItem()}>Add Item</button>
        <button onClick={addItem(true)}>Add Column</button>
        <button onClick={addItem(true, true)}>Add Row</button>
      </div>
      <DndContext
        announcements={announcements}
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        strategy={closestCorners}
      >
        <SortableContext
          id="root"
          items={getItemIds()}
          strategy={verticalListSortingStrategy}
        >
          <div style={wrapperStyle}>
            {getItems().map((item) => {
              if (item.container) {
                return (
                  <SortableContainer
                    key={item.id}
                    id={item.id}
                    getItems={getItems}
                    row={item.row}
                  />
                );
              }

              return (
                <SortableItem key={item.id} id={item.id}>
                  <Item id={item.id} />
                </SortableItem>
              );
            })}
          </div>
        </SortableContext>
        <DragOverlay>{getDragOverlay()}</DragOverlay>
      </DndContext>
    </div>
  );

  function addItem(container, row) {
    return () => {
      setData((prev) => ({
        items: [
          ...prev.items,
          {
            id: prev.items.length + 1,
            container,
            row
          }
        ]
      }));
    };
  }

  function isContainer(id) {
    const item = data.items.find((item) => item.id === id);

    return !item ? false : item.container;
  }

  function isRow(id) {
    const item = data.items.find((item) => item.id === id);

    return !item ? false : item.row;
  }

  function getItems(parent) {
    return data.items.filter((item) => {
      if (!parent) {
        return !item.parent;
      }

      return item.parent === parent;
    });
  }

  function getItemIds(parent) {
    return getItems(parent).map((item) => item.id);
  }

  function findParent(id) {
    const item = data.items.find((item) => item.id === id);
    return !item ? false : item.parent;
  }

  function getDragOverlay() {
    if (!activeId) {
      return null;
    }

    if (isContainer(activeId)) {
      const item = data.items.find((i) => i.id === activeId);

      return (
        <Container row={item.row}>
          {getItems(activeId).map((item) => (
            <Item key={item.id} id={item.id} />
          ))}
        </Container>
      );
    }

    return <Item id={activeId} />;
  }

  function handleDragStart(event) {
    const { active } = event;
    const { id } = active;

    setActiveId(id);
  }

  function handleDragOver(event) {
    const { active, over, draggingRect } = event;
    const { id } = active;
    let overId;
    if (over) {
      overId = over.id;
    }

    const overParent = findParent(overId);
    const overIsContainer = isContainer(overId);
    const activeIsContainer = isContainer(activeId);
    if (overIsContainer) {
      const overIsRow = isRow(overId);
      const activeIsRow = isRow(activeId);
      // only columns to be added to rows
      if (overIsRow) {
        if (activeIsRow) {
          return;
        }

        if (!activeIsContainer) {
          return;
        }
      } else if (activeIsContainer) {
        return;
      }
    }

    setData((prev) => {
      const activeIndex = data.items.findIndex((item) => item.id === id);
      const overIndex = data.items.findIndex((item) => item.id === overId);

      let newIndex = overIndex;
      const isBelowLastItem =
        over &&
        overIndex === prev.items.length - 1 &&
        draggingRect.offsetTop > over.rect.offsetTop + over.rect.height;

      const modifier = isBelowLastItem ? 1 : 0;

      newIndex = overIndex >= 0 ? overIndex + modifier : prev.items.length + 1;

      let nextParent;
      if (overId) {
        nextParent = overIsContainer ? overId : overParent;
      }

      prev.items[activeIndex].parent = nextParent;
      const nextItems = arrayMove(prev.items, activeIndex, newIndex);

      return {
        items: nextItems
      };
    });
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    const { id } = active;
    let overId;
    if (over) {
      overId = over.id;
    }

    const activeIndex = data.items.findIndex((item) => item.id === id);
    const overIndex = data.items.findIndex((item) => item.id === overId);

    let newIndex = overIndex >= 0 ? overIndex : 0;

    if (activeIndex !== overIndex) {
      setData((prev) => ({
        items: arrayMove(prev.items, activeIndex, newIndex)
      }));
    }

    setActiveId(null);
  }
}
