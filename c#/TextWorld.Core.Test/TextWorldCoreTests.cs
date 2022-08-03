using FluentAssertions;
using System;
using System.Collections.Generic;
using System.Linq;
using TextWorld.Core.Components;
using TextWorld.Core.Data;
using TextWorld.Core.ECS;
using TextWorld.Core.Items;
using TextWorld.Core.Misc;
using TextWorld.Core.Systems;
using Xunit;

namespace TextWorld.Core.Test
{
    public class TextWorldCoreTests
    {
        private readonly Guid coinId = Guid.NewGuid();
        private readonly Guid healthPotionId = Guid.NewGuid();

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
            component.Should().NotBeNull();

            if (component != null)
            {
                component.Name.Should().Be(componentName);
                component.Description.Should().Be(description);
            }
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
            component.Should().NotBeNull();

            if (component != null)
            {
                component.Name.Should().Be(componentName);
                component.Description.Should().Be(description);
            }
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
            if (component != null)
            {
                entity.RemoveComponent(component);
            }

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
            var outputEntity = new TWEntity("output");
            var motdEntity = new TWEntity("motd");
            var motdSystem = new MOTDSystem();
            var motd = "This is the message of the day.";
            motdEntity.AddComponent(new DescriptionComponent("description", motd));

            var gameEntities = new TWEntityCollection();
            gameEntities.AddEntity("misc", motdEntity);
            gameEntities.AddEntity("misc", outputEntity);

            // Act
            motdSystem.Run(gameEntities);

            var outputComponent = outputEntity.GetComponentByType<OutputComponent>();

            // Assert
            outputComponent.Should().NotBeNull();
            if (outputComponent != null)
            {
                outputComponent.Value.Should().Be(motd);
            }
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
            commandComponent.Should().NotBeNull();

            if (commandComponent != null)
            {
                commandComponent.Command.Should().Be(command);
                commandComponent.Args.Should().HaveCount(1);
                commandComponent.Args.First().Should().Be(arg);
            }
        }

        [Fact]
        public void CanShowItemsOnEntity()
        {
            // Arrange
            var itemsSystem = new ItemSystem();
            var playerEntity = new TWEntity("player");
            var roomEntities = new List<TWEntity>();
            var outputEntity = new TWEntity("output");
            var commandEntity = new TWEntity("command");

            var roomId = Guid.NewGuid();
            var room = new TWEntity(roomId, "New Room", new List<TWComponent>()
                {
                   new ItemDropComponent("item", new InventoryItem
                    {
                        Id = Guid.NewGuid(),
                        Name = "leather coin purse",
                        Quantity = 1
                    }),
                });
            roomEntities.Add(room);

            Helper.AddCommandComponentToEntity(commandEntity, "show all");
            var commandComponent = commandEntity.GetComponentByType<CommandComponent>();

            playerEntity.AddComponent(new IdComponent("player current room", roomId, IdType.Room));
            playerEntity.AddComponent(new ItemActionComponent("show room items", commandComponent!, ItemActionType.ShowAll, Helper.ShowAllItemAction));

            var gameEntities = new TWEntityCollection();
            gameEntities.AddEntity("players", playerEntity);
            gameEntities.AddEntity("rooms", room);
            gameEntities.AddEntity("misc", commandEntity);
            gameEntities.AddEntity("misc", outputEntity);
            gameEntities.AddEntities("items", new List<TWEntity>());

            // Act
            itemsSystem.Run(gameEntities);
            var outputComponent = outputEntity.GetComponentByType<OutputComponent>();

            // Assert
            outputComponent.Should().NotBeNull();

            if (outputComponent != null)
            {
                outputComponent.Value.Should().Contain("The following items are here:");
            }
        }

        [Fact]
        public void CanShowItemOnEntity()
        {
            // Arrange
            var itemsSystem = new ItemSystem();
            var playerEntity = new TWEntity("player");
            var roomEntities = new List<TWEntity>();
            var outputEntity = new TWEntity("output");
            var commandEntity = new TWEntity("command");

            var roomId = Guid.NewGuid();
            var room = new TWEntity(roomId, "New Room", new List<TWComponent>()
                {
                    new ItemDropComponent("item", new InventoryItem
                    {
                        Id = Guid.NewGuid(),
                        Name = "leather coin purse",
                        Quantity = 1
                    }),
                });
            roomEntities.Add(room);

            Helper.AddCommandComponentToEntity(commandEntity, "show leather coin purse");
            var commandComponent = commandEntity.GetComponentByType<CommandComponent>();

            playerEntity.AddComponent(new IdComponent("player current room", roomId, IdType.Room));
            playerEntity.AddComponent(new ItemActionComponent("show room items", "leather coin purse", commandComponent!, ItemActionType.Show, Helper.ShowItemAction));

            var gameEntities = new TWEntityCollection();
            gameEntities.AddEntity("players", playerEntity);
            gameEntities.AddEntity("rooms", room);
            gameEntities.AddEntity("misc", commandEntity);
            gameEntities.AddEntity("misc", outputEntity);
            gameEntities.AddEntities("items", new List<TWEntity>());

            // Act
            itemsSystem.Run(gameEntities);
            var outputComponent = outputEntity.GetComponentByType<OutputComponent>();

            // Assert
            outputComponent.Should().NotBeNull();

            if (outputComponent != null)
            {
                outputComponent.Value.Should().Contain("leather coin purse");
            }
        }

        [Fact]
        public void CanTakeItemOnEntity()
        {
            // Arrange
            var itemsSystem = new ItemSystem();
            var playerEntity = new TWEntity("player");
            var roomEntities = new List<TWEntity>();
            var outputEntity = new TWEntity("output");
            var commandEntity = new TWEntity("command");

            var roomId = Guid.NewGuid();
            var room = new TWEntity(roomId, "New Room", new List<TWComponent>()
                {
                    new ItemDropComponent("item", new InventoryItem
                    {
                        Id = Guid.NewGuid(),
                        Name = "leather coin purse",
                        Quantity = 1
                    }),
                });

            Helper.AddCommandComponentToEntity(commandEntity, "take leather coin purse");
            var commandComponent = commandEntity.GetComponentByType<CommandComponent>();

            playerEntity.AddComponent(new InventoryComponent("player inventory"));
            playerEntity.AddComponent(new IdComponent("player current room", roomId, IdType.Room));
            playerEntity.AddComponent(new ItemActionComponent("take item from room", "leather coin purse", commandComponent!, ItemActionType.Take, Helper.TakeItemAction));
            roomEntities.Add(room);

            var gameEntities = new TWEntityCollection();
            gameEntities.AddEntity("players", playerEntity);
            gameEntities.AddEntity("rooms", room);
            gameEntities.AddEntity("misc", commandEntity);
            gameEntities.AddEntity("misc", outputEntity);
            gameEntities.AddEntities("items", new List<TWEntity>());

            // Act
            itemsSystem.Run(gameEntities);
            var outputComponent = outputEntity.GetComponentByType<OutputComponent>();
            var playerCurrentRoom = Helper.GetPlayersCurrentRoom(playerEntity, roomEntities);

            // Assert
            playerCurrentRoom.Should().NotBeNull();
            outputComponent.Should().NotBeNull();

            if (playerCurrentRoom != null)
            {
                var takenItemComponent = playerCurrentRoom.GetComponentsByType<ItemComponent>().FirstOrDefault(x => x.Item.Name == "leather coin purse");
                takenItemComponent.Should().BeNull();
            }

            if (outputComponent != null)
            {
                outputComponent.Value.Should().Contain("You've taken leather coin purse");
            }
        }

        [Fact]
        public void CanProcessQuitCommand()
        {
            // Arrange
            var playerEntity = new TWEntity("player");
            var roomEntities = new List<TWEntity>();
            var commandEntity = new TWEntity("command");
            var commandSystem = new CommandSystem();

            var roomId = Guid.NewGuid();
            var room = new TWEntity(roomId, "New Room");

            playerEntity.AddComponent(new InventoryComponent("player inventory"));
            playerEntity.AddComponent(new IdComponent("player current room", roomId, IdType.Room));
            roomEntities.Add(room);

            Helper.AddCommandComponentToEntity(commandEntity, "quit");

            var gameEntities = new TWEntityCollection();
            gameEntities.AddEntity("players", playerEntity);
            gameEntities.AddEntity("rooms", room);
            gameEntities.AddEntity("misc", commandEntity);

            // Act
            commandSystem.Run(gameEntities);
            var quitComponent = playerEntity.GetComponentByType<QuitComponent>();

            // Assert
            quitComponent.Should().NotBeNull();

            if (quitComponent != null)
            {
                quitComponent.Name.Should().Be("quit game");
            }
        }

        [Fact]
        public void CanProcessLookCommand()
        {
            // Arrange
            var playerEntity = new TWEntity("player");
            var roomEntities = new List<TWEntity>();
            var commandEntity = new TWEntity("command");
            var commandSystem = new CommandSystem();

            var roomId = Guid.NewGuid();
            var room = new TWEntity(roomId, "Test Room", new List<TWComponent>()
            {
                new DescriptionComponent("Test", "This is a test room."),
            });

            playerEntity.AddComponent(new InventoryComponent("player inventory"));
            playerEntity.AddComponent(new IdComponent("player current room", roomId, IdType.Room));
            roomEntities.Add(room);

            Helper.AddCommandComponentToEntity(commandEntity, "look");

            var gameEntities = new TWEntityCollection();
            gameEntities.AddEntity("players", playerEntity);
            gameEntities.AddEntity("rooms", room);
            gameEntities.AddEntity("misc", commandEntity);            

            // Act
            commandSystem.Run(gameEntities);
            var showRoomDescriptionComponent = playerEntity.GetComponentByType<ShowDescriptionComponent>();

            // Assert
            showRoomDescriptionComponent.Should().NotBeNull();

            if (showRoomDescriptionComponent != null)
            {
                showRoomDescriptionComponent.Entity.Should().Be(room);
            }
        }

        [Fact]
        public void CanProcessLookSelfCommand()
        {
            // Arrange
            var playerEntity = new TWEntity("player");
            var roomEntities = new List<TWEntity>();
            var commandEntity = new TWEntity("command");
            var commandSystem = new CommandSystem();

            var roomId = Guid.NewGuid();
            var room = new TWEntity(roomId, "Test Room");

            playerEntity.AddComponent(new InventoryComponent("player inventory"));
            playerEntity.AddComponent(new IdComponent("player current room", roomId, IdType.Room));
            roomEntities.Add(room);

            Helper.AddCommandComponentToEntity(commandEntity, "look self");

            var gameEntities = new TWEntityCollection();
            gameEntities.AddEntity("players", playerEntity);
            gameEntities.AddEntity("rooms", room);
            gameEntities.AddEntity("misc", commandEntity);

            // Act
            commandSystem.Run(gameEntities);
            var showRoomDescriptionComponent = playerEntity.GetComponentByType<ShowDescriptionComponent>();

            // Assert
            showRoomDescriptionComponent.Should().NotBeNull();

            if (showRoomDescriptionComponent != null)
            {
                showRoomDescriptionComponent.Entity.Should().Be(playerEntity);
            }
        }

        [Fact]
        public void CanProcessInspectCommand()
        {
            // Arrange
            var playerEntity = new TWEntity("player");
            var roomEntities = new List<TWEntity>();
            var commandEntity = new TWEntity("command");
            var commandSystem = new CommandSystem();
            var outputEntity = new TWEntity("output");
            
            var roomId = Guid.NewGuid();
            var room = new TWEntity(roomId, "Test Room", new List<TWComponent>()
            {
                new ItemComponent("leather coin purse item", new CoinPurse(coinId, "leather coin purse", 32, "An ordinary coin purse", Array.Empty<string>())),
                new ItemComponent("health potion item", new HealthPotion(healthPotionId, "health potion", 50, "An ordinary health potion", new [] { "potion" })),
            });

            playerEntity.AddComponent(new InventoryComponent("player inventory"));
            playerEntity.AddComponent(new IdComponent("player current room", roomId, IdType.Room));
            roomEntities.Add(room);

            Helper.AddCommandComponentToEntity(commandEntity, "inspect");

            var gameEntities = new TWEntityCollection();
            gameEntities.AddEntity("players", playerEntity);
            gameEntities.AddEntity("rooms", room);
            gameEntities.AddEntity("misc", commandEntity);
            gameEntities.AddEntity("misc", outputEntity);

            // Act
            commandSystem.Run(gameEntities);
            var itemActionComponent = playerEntity.GetComponentByType<ItemActionComponent>();

            // Assert            
            itemActionComponent.Should().NotBeNull();
            if (itemActionComponent != null)
            {
                itemActionComponent.ActionType.Should().Be(ItemActionType.ShowAll);
            }
        }

        [Fact]
        public void CanProcessTakeCommand()
        {
            // Arrange
            var playerEntity = new TWEntity("player");
            var roomEntities = new List<TWEntity>();
            var commandEntity = new TWEntity("command");
            var commandSystem = new CommandSystem();
            var outputEntity = new TWEntity("output");
            
            var roomId = Guid.NewGuid();
            var room = new TWEntity(roomId, "Test Room", new List<TWComponent>()
            {
                new ItemComponent("health potion item", new HealthPotion(healthPotionId, "health potion", 50, "An ordinary health potion", new [] { "potion" }))
            });

            playerEntity.AddComponent(new InventoryComponent("player inventory"));
            playerEntity.AddComponent(new IdComponent("player current room", roomId, IdType.Room));
            roomEntities.Add(room);

            Helper.AddCommandComponentToEntity(commandEntity, "take health potion");

            var gameEntities = new TWEntityCollection();
            gameEntities.AddEntity("players", playerEntity);
            gameEntities.AddEntity("rooms", room);
            gameEntities.AddEntity("misc", commandEntity);
            gameEntities.AddEntity("misc", outputEntity);

            // Act
            commandSystem.Run(gameEntities);
            var itemActionComponent = playerEntity.GetComponentByType<ItemActionComponent>();

            // Assert
            itemActionComponent.Should().NotBeNull();

            if (itemActionComponent != null)
            {
                itemActionComponent.ActionType.Should().Be(ItemActionType.Take);
            }
        }

        [Fact]
        public void CanProcessTakeAllCommand()
        {
            // Arrange
            var playerEntity = new TWEntity("player");
            var roomEntities = new List<TWEntity>();
            var commandEntity = new TWEntity("command");
            var commandSystem = new CommandSystem();
            var outputEntity = new TWEntity("output");

            var roomId = Guid.NewGuid();
            var room = new TWEntity(roomId, "Test Room", new List<TWComponent>()
            {
                new ItemComponent("health potion item", new HealthPotion(healthPotionId, "health potion", 50, "An ordinary health potion", Array.Empty<string>()))
            });

            playerEntity.AddComponent(new InventoryComponent("player inventory"));
            playerEntity.AddComponent(new IdComponent("player current room", roomId, IdType.Room));
            roomEntities.Add(room);

            Helper.AddCommandComponentToEntity(commandEntity, "take all");

            var gameEntities = new TWEntityCollection();
            gameEntities.AddEntity("players", playerEntity);
            gameEntities.AddEntity("rooms", room);
            gameEntities.AddEntity("misc", commandEntity);
            gameEntities.AddEntity("misc", outputEntity);

            commandSystem.Run(gameEntities);
            var itemActionComponent = playerEntity.GetComponentByType<ItemActionComponent>();

            // Act
            itemActionComponent.Should().NotBeNull();

            if (itemActionComponent != null)
            {
                itemActionComponent.ActionType.Should().Be(ItemActionType.TakeAll);
            }
        }

        [Fact]
        public void CanProcessDropCommand()
        {
            // Arrange
            var playerEntity = new TWEntity("player");
            var roomEntities = new List<TWEntity>();
            var commandEntity = new TWEntity("command");
            var commandSystem = new CommandSystem();
            var outputEntity = new TWEntity("output");

            var roomId = Guid.NewGuid();
            var room = new TWEntity(roomId, "Test Room", new List<TWComponent>()
            {
                new ItemComponent("health potion item", new HealthPotion(healthPotionId, "health potion", 50, "An ordinary health potion", Array.Empty<string>()))
            });

            playerEntity.AddComponent(new InventoryComponent("player inventory"));
            playerEntity.AddComponent(new IdComponent("player current room", roomId, IdType.Room));
            roomEntities.Add(room);

            Helper.AddCommandComponentToEntity(commandEntity, "drop health potion");

            var gameEntities = new TWEntityCollection();
            gameEntities.AddEntity("players", playerEntity);
            gameEntities.AddEntity("rooms", room);
            gameEntities.AddEntity("misc", commandEntity);
            gameEntities.AddEntity("misc", outputEntity);
            
            commandSystem.Run(gameEntities);
            var itemActionComponent = playerEntity.GetComponentByType<ItemActionComponent>();

            // Act
            itemActionComponent.Should().NotBeNull();

            if (itemActionComponent != null)
            {
                itemActionComponent.ActionType.Should().Be(ItemActionType.Drop);
            }
        }

        [Fact]
        public void CanShowRoomDescription()
        {
            // Arrange
            var playerEntity = new TWEntity("player");
            var roomEntities = new List<TWEntity>();
            var commandEntity = new TWEntity("command");
            var outputEntity = new TWEntity("output");
            var commandSystem = new CommandSystem();
            var roomId = Guid.NewGuid();
            var roomDescription = "You are standing in an open field. All around you stands vibrant green grass. You can hear the sound of flowing water off in the distance which you suspect is a stream.";
            var room = new TWEntity(roomId, "Test Room", new List<TWComponent>()
            {
                new DescriptionComponent("open field description", roomDescription),
            });

            playerEntity.AddComponent(new IdComponent("player current room", roomId, IdType.Room));
            roomEntities.Add(room);

            Helper.AddCommandComponentToEntity(commandEntity, "look");

            var gameEntities = new TWEntityCollection();
            gameEntities.AddEntity("players", playerEntity);
            gameEntities.AddEntity("rooms", room);
            gameEntities.AddEntity("misc", commandEntity);
            gameEntities.AddEntity("misc", outputEntity);

            // Act
            commandSystem.Run(gameEntities);

            var showRoomDescription = playerEntity.GetComponentByType<ShowDescriptionComponent>();

            // Assert
            showRoomDescription.Should().NotBeNull();
            showRoomDescription!.Entity.Should().NotBeNull();

            var roomDescriptionComponent = showRoomDescription!.Entity!.GetComponentByType<DescriptionComponent>();

            roomDescriptionComponent.Should().NotBeNull();
            roomDescriptionComponent!.Description.Should().Be(roomDescription);
        }

        [Fact]
        public void CanLoadGameData()
        {
            var gameLoader = new GameLoader();
            var loaded = gameLoader.Load("game.json");
            var gameEntities = gameLoader.GetGameEntities();

            loaded.Should().BeTrue();

            gameEntities.GetEntitiesByName("players").Should().HaveCount(1);
            gameEntities.GetEntitiesByName("misc").Should().HaveCountGreaterThan(1);
            gameEntities.GetEntitiesByName("rooms").Should().HaveCountGreaterThan(1);
            gameEntities.GetEntitiesByName("items").Should().HaveCountGreaterThan(1);

            var player = gameEntities.GetEntityByName("players", "player");
            var rooms = gameEntities.GetEntitiesByName("rooms");

            // Check to make sure players current room is one of the ones that exists in the list of rooms
            var playerCurrentRoom = player!.GetComponentByType<IdComponent>();
            playerCurrentRoom.Should().NotBeNull();
            var playerCurrentRoomId = playerCurrentRoom!.Id;
            var playerCurrentRoomExists = rooms!.Any(r => r.Id == playerCurrentRoomId);
            playerCurrentRoomExists.Should().BeTrue();
        }
    }
}