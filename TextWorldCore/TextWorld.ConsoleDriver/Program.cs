using TextWorld.Game;

namespace TextWorld.ConsoleDriver
{
    static class Program
    {
        static void Main()
        {
            var tw = new TextWorldGame();
            tw.RunOnConsole();
        }
    }
}
