using FluentAssertions;
using System;
using TextWorld.Core.Components;
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
            var entity = new Entity("test entity");
            // Assert
            entity.Id.Should().NotBe(Guid.Empty);
        }

        [Fact]
        public void CanCreateEntityWithComponent()
        {
            // Arrange
            var entity = new Entity("test entity");
            entity.AddComponent(new DescriptionComponent("test component", "This is a test description"));
            // Act            
            // Assert
            entity.Components.Should().HaveCount(1);
        }

        [Fact]
        public void CanGetEntityComponentByType()
        {
            // Arrange
            var entity = new Entity("test entity");
            string componentName = "test description component";
            string description = "This is a test description";
            entity.AddComponent(new DescriptionComponent(componentName, description));
            // Act            
            var component = entity.GetFirstComponentByType<DescriptionComponent>();
            // Assert
            component.Name.Should().Be(componentName);
            component.Description.Should().Be(description);
        }

        [Fact]
        public void CanGetEntityComponentsByType()
        {
            // Arrange
            var entity = new Entity("test entity");
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
            var entity = new Entity("test entity");
            string componentName = "test description component";
            string description = "This is a test description";
            entity.AddComponent(new DescriptionComponent(componentName, description));
            // Act            
            var component = entity.GetFirstComponentByName<DescriptionComponent>(componentName);
            // Assert
            component.Name.Should().Be(componentName);
            component.Description.Should().Be(description);
        }

        [Fact]
        public void CanRemoveEntityComponent()
        {
            // Arrange
            var entity = new Entity("test entity");
            string componentName = "test description component";
            string description = "This is a test description";
            entity.AddComponent(new DescriptionComponent(componentName, description));
            // Act            
            var component = entity.GetFirstComponentByName<DescriptionComponent>(componentName);
            entity.RemoveComponent(component);
            // Assert
            entity.Components.Should().BeEmpty();
        }

        [Fact]
        public void CanRemoveEntityComponentsByType()
        {
            // Arrange
            var entity = new Entity("test entity");
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
            var outputEntity = new Entity("Output Entity");
            var motdEntity = new Entity("MOTD Entity");
            var motdSystem = new MOTDSystem();
            var motd = "This is the message of the day.";
            motdEntity.AddComponent(new DescriptionComponent("description", motd));

            // Act
            motdSystem.Run(motdEntity, outputEntity);

            var outputComponent = outputEntity.GetFirstComponentByType<OutputComponent>();

            // Assert
            outputComponent.Should().NotBeNull();
            outputComponent.Value.Should().Be(motd);            
        }
    
        [Fact]
        public void CanGetCommandAndArgs()
        {
            // We need to refactor the ConsoleInputSystem to extract the Entity/Component
            // bits from the actual Console.Readline stuff. We need to be able to test this
            // independently of any actual input system by injecting commands and processing
            // them through tests.

            throw new NotImplementedException();
        }
    }
}
