using FluentAssertions;
using System;
using System.Collections.Generic;
using System.Linq;
using TextWorld.Core.Components;
using TextWorld.Core.ECS;
using TextWorld.Core.Items;
using TextWorld.Core.Misc;
using TextWorld.Core.Systems;
using Xunit;

namespace TextWorld.Core.Test
{
    public class TextWorldCoreTests
    {
        [Fact]
        public void CanCreateEmptyEntity()
        {
            // Arrange
            // Act
            var entity = new TWEntity("test entity");
            // Assert
            entity.Id.Should().NotBe(Guid.Empty);
        }

        [Fact]
        public void CanCreateEntityWithComponent()
        {
            // Arrange
            var entity = new TWEntity("test entity");
            entity.AddComponent(new DescriptionComponent("test component", "This is a test description"));
            // Act            
            // Assert
            entity.Components.Should().HaveCount(1);
        }

        [Fact]
        public void CanGetEntityComponentByType()
        {
            // Arrange
            var entity = new TWEntity("test entity");
            string componentName = "test description component";
            string description = "This is a test description";
            entity.AddComponent(new DescriptionComponent(componentName, description));
            // Act            
            var component = entity.GetComponentByType<DescriptionComponent>();
            // Assert
            component.Name.Should().Be(componentName);
            component.Description.Should().Be(description);
        }

        [Fact]
        public void CanGetEntityComponentsByType()
        {
            // Arrange
            var entity = new TWEntity("test entity");
            entity.AddComponent(new TestComponent("test component 1"));
            entity.AddComponent(new TestComponent("test component 2"));
            // Act                        
            var components = entity.GetComponentsByType<TestComponent>();
            // Assert
            components.Should().HaveCount(2);
        }

        [Fact]
        public void CanGetEntityComponentByName()
        {
            // Arrange
            var entity = new TWEntity("test entity");
            string componentName = "test description component";
            string description = "This is a test description";
            entity.AddComponent(new DescriptionComponent(componentName, description));
            // Act            
            var component = entity.GetComponentByName<DescriptionComponent>(componentName);
            // Assert
            component.Name.Should().Be(componentName);
            component.Description.Should().Be(description);
        }

        [Fact]
        public void CanRemoveEntityComponent()
        {
            // Arrange
            var entity = new TWEntity("test entity");
            string componentName = "test description component";
            string description = "This is a test description";
            entity.AddComponent(new DescriptionComponent(componentName, description));
            // Act            
            var component = entity.GetComponentByName<DescriptionComponent>(componentName);
            entity.RemoveComponent(component);
            // Assert
            entity.Components.Should().BeEmpty();
        }

        [Fact]
        public void CanRemoveEntityComponentsByType()
        {
            // Arrange
            var entity = new TWEntity("test entity");
            entity.AddComponent(new TestComponent("test component 1"));
            entity.AddComponent(new TestComponent("test component 2"));
            // Act                        
            entity.RemoveComponentsByType<TestComponent>();
            // Assert
            entity.Components.Should().BeEmpty();
        }

        [Fact]
        public void MOTDSystemOutputsMOTD()
        {
            // Arrange
            var outputEntity = new TWEntity("Output Entity");
            var motdEntity = new TWEntity("MOTD Entity");
            var motdSystem = new MOTDSystem();
            var motd = "This is the message of the day.";
            motdEntity.AddComponent(new DescriptionComponent("description", motd));

            // Act
            motdSystem.Run(motdEntity, outputEntity);

            var outputComponent = outputEntity.GetComponentByType<OutputComponent>();

            // Assert
            outputComponent.Should().NotBeNull();
            outputComponent.Value.Should().Be(motd);
        }

        [Fact]
        public void CanGetCommandWithArgs()
        {
            // Arrange
            var commandEntity = new TWEntity("commands");
            var command = "get";
            var arg = "lamp";

            // Act
            Helper.AddCommandComponentToEntity(commandEntity, $"{command} {arg}");
            var commandComponent = commandEntity.GetComponentByType<CommandComponent>();

            // Assert
            commandComponent.Command.Should().Be(command);
            commandComponent.Args.Should().HaveCount(1);
            commandComponent.Args[0].Should().Be(arg);
        }

        [Fact]
        public void CanShowItemsOnEntity()
        {
            // Arrange
            var itemsSystem = new ItemSystem();
            var playerEntity = new TWEntity("player");
            var roomEntities = new List<TWEntity>();
            var outputEntity = new TWEntity("output");

            var roomId = Guid.NewGuid();
            var room = new TWEntity(roomId, "New Room", new List<TWComponent>()
                {
                    new ItemComponent("item", new CoinPurse("leather coin purse", 64, 1)),
                });

            playerEntity.AddComponent(new IdComponent("player current room", roomId));
            playerEntity.AddComponent(new ItemActionComponent("show room items", ItemAction.ShowAll));
            roomEntities.Add(room);

            // Act
            itemsSystem.Run(playerEntity, roomEntities, outputEntity);
            var outputComponent = outputEntity.GetComponentByType<OutputComponent>();

            // Assert
            outputComponent.Should().NotBeNull();
            outputComponent.Value.Should().Contain("The following items are here:");
        }

        [Fact]
        public void CanTakeItemOnEntity()
        {
            // Arrange
            var itemsSystem = new ItemSystem();
            var playerEntity = new TWEntity("player");
            var roomEntities = new List<TWEntity>();
            var outputEntity = new TWEntity("output");

            var roomId = Guid.NewGuid();
            var room = new TWEntity(roomId, "New Room", new List<TWComponent>()
                {
                    new ItemComponent("item", new CoinPurse("leather coin purse", 64, 1)),
                });

            playerEntity.AddComponent(new InventoryComponent("player inventory"));
            playerEntity.AddComponent(new IdComponent("player current room", roomId));
            playerEntity.AddComponent(new ItemActionComponent("take item from room", "leather coin purse", ItemAction.Take));
            roomEntities.Add(room);

            // Act
            itemsSystem.Run(playerEntity, roomEntities, outputEntity);
            var outputComponent = outputEntity.GetComponentByType<OutputComponent>();
            var playerCurrentRoom = Helper.GetPlayersCurrentRoom(playerEntity, roomEntities);
            var takenItemComponent = playerCurrentRoom.GetComponentsByType<ItemComponent>().FirstOrDefault(x => x.Item.Name == "leather coin purse");

            // Assert
            outputComponent.Should().NotBeNull();
            outputComponent.Value.Should().Contain("You've taken leather coin purse");
            takenItemComponent.Should().BeNull();
        }

        [Fact]
        public void CanProcessQuitCommand()
        {
            // Arrange
            var playerEntity = new TWEntity("player");
            var roomEntities = new List<TWEntity>();
            var commandEntity = new TWEntity("Command Entity");
            var commandSystem = new CommandSystem();

            var roomId = Guid.NewGuid();
            var room = new TWEntity(roomId, "New Room");

            playerEntity.AddComponent(new InventoryComponent("player inventory"));
            playerEntity.AddComponent(new IdComponent("player current room", roomId));
            playerEntity.AddComponent(new ItemActionComponent("take item from room", "leather coin purse", ItemAction.Take));
            roomEntities.Add(room);

            Helper.AddCommandComponentToEntity(commandEntity, "quit");

            // Act
            commandSystem.Run(commandEntity, playerEntity, roomEntities, playerEntity);
            var quitComponent = playerEntity.GetComponentByType<QuitComponent>();

            // Assert
            quitComponent.Should().NotBeNull();
            quitComponent.Name.Should().Be("quit game");
        }

        [Fact]
        public void CanProcessLookCommand()
        {
            // Arrange
            var playerEntity = new TWEntity("player");
            var roomEntities = new List<TWEntity>();
            var commandEntity = new TWEntity("Command Entity");
            var commandSystem = new CommandSystem();

            var roomId = Guid.NewGuid();
            var room = new TWEntity(roomId, "Test Room", new List<TWComponent>()
            {
                new DescriptionComponent("Test", "This is a test room."),
            });

            playerEntity.AddComponent(new InventoryComponent("player inventory"));
            playerEntity.AddComponent(new IdComponent("player current room", roomId));
            playerEntity.AddComponent(new ItemActionComponent("take item from room", "leather coin purse", ItemAction.Take));
            roomEntities.Add(room);

            Helper.AddCommandComponentToEntity(commandEntity, "look");

            // Act
            commandSystem.Run(commandEntity, playerEntity, roomEntities, playerEntity);
            var showRoomDescriptionComponent = playerEntity.GetComponentByType<ShowDescriptionComponent>();

            // Assert
            showRoomDescriptionComponent.Should().NotBeNull();
            showRoomDescriptionComponent.Entity.Should().Be(room);
        }

        [Fact]
        public void CanProcessLookSelfCommand()
        {
            // Arrange
            var playerEntity = new TWEntity("player");
            var roomEntities = new List<TWEntity>();
            var commandEntity = new TWEntity("Command Entity");
            var commandSystem = new CommandSystem();

            var roomId = Guid.NewGuid();
            var room = new TWEntity(roomId, "Test Room");

            playerEntity.AddComponent(new InventoryComponent("player inventory"));
            playerEntity.AddComponent(new IdComponent("player current room", roomId));
            playerEntity.AddComponent(new ItemActionComponent("take item from room", "leather coin purse", ItemAction.Take));
            roomEntities.Add(room);

            Helper.AddCommandComponentToEntity(commandEntity, "look self");

            // Act
            commandSystem.Run(commandEntity, playerEntity, roomEntities, playerEntity);
            var showRoomDescriptionComponent = playerEntity.GetComponentByType<ShowDescriptionComponent>();

            // Assert
            showRoomDescriptionComponent.Should().NotBeNull();
            showRoomDescriptionComponent.Entity.Should().Be(playerEntity);
        }

        [Fact]
        public void CanProcessInspectCommand()
        {
            // Arrange
            var playerEntity = new TWEntity("player");
            var roomEntities = new List<TWEntity>();
            var commandEntity = new TWEntity("Command Entity");
            var commandSystem = new CommandSystem();

            var roomId = Guid.NewGuid();
            var room = new TWEntity(roomId, "Test Room", new List<TWComponent>()
            {
                new ItemComponent("leather coin purse item", new CoinPurse("leather coin purse", 32, 1)),
                new ItemComponent("health potion item", new HealthPotion("health potion", 50, 10))
            });

            playerEntity.AddComponent(new InventoryComponent("player inventory"));
            playerEntity.AddComponent(new IdComponent("player current room", roomId));
            roomEntities.Add(room);

            Helper.AddCommandComponentToEntity(commandEntity, "inspect");

            // Act
            commandSystem.Run(commandEntity, playerEntity, roomEntities, playerEntity);
            var itemActionComponent = playerEntity.GetComponentByType<ItemActionComponent>();

            // Assert            
            itemActionComponent.Should().NotBeNull();
            itemActionComponent.Action.Should().Be(ItemAction.ShowAll);
        }

        [Fact]
        public void CanProcessTakeCommand()
        {
            // Arrange
            var playerEntity = new TWEntity("player");
            var roomEntities = new List<TWEntity>();
            var commandEntity = new TWEntity("Command Entity");
            var commandSystem = new CommandSystem();

            var roomId = Guid.NewGuid();
            var room = new TWEntity(roomId, "Test Room", new List<TWComponent>()
            {                
                new ItemComponent("health potion item", new HealthPotion("health potion", 50, 10))
            });

            playerEntity.AddComponent(new InventoryComponent("player inventory"));
            playerEntity.AddComponent(new IdComponent("player current room", roomId));
            roomEntities.Add(room);

            Helper.AddCommandComponentToEntity(commandEntity, "take health potion");

            // Act
            commandSystem.Run(commandEntity, playerEntity, roomEntities, playerEntity);
            var itemActionComponent = playerEntity.GetComponentByType<ItemActionComponent>();

            // Assert
            itemActionComponent.Should().NotBeNull();
            itemActionComponent.Action.Should().Be(ItemAction.Take);
        }
    }
}
